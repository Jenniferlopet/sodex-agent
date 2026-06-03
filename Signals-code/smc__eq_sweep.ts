/**
 * Equal Highs/Lows Sweep Strategy
 */
import { Candle, Signal, makeSignal, atr, swingHighs, swingLows } from "../../common";

export function detectEqSweepSignal(
  candles: Candle[],
  opts: { toleranceAtr?: number; swingLb?: number } = {}
): Signal {
  const { toleranceAtr = 0.15, swingLb = 5 } = opts;
  if (candles.length < 50) return makeSignal({ reason: "Insufficient data" });

  const atrValues = atr(candles, 14);
  const currentAtr = atrValues[atrValues.length - 1];
  const tolerance = currentAtr * toleranceAtr;

  const recentHighs = swingHighs(candles, swingLb)
    .filter((v): v is number => v !== null).slice(-10);
  const recentLows = swingLows(candles, swingLb)
    .filter((v): v is number => v !== null).slice(-10);

  let eqhLevel: number | null = null;
  let eqlLevel: number | null = null;

  for (let i = 0; i < recentHighs.length - 1; i++) {
    for (let j = i + 1; j < recentHighs.length; j++) {
      if (Math.abs(recentHighs[i] - recentHighs[j]) <= tolerance) {
        eqhLevel = Math.max(recentHighs[i], recentHighs[j]);
        break;
      }
    }
  }
  for (let i = 0; i < recentLows.length - 1; i++) {
    for (let j = i + 1; j < recentLows.length; j++) {
      if (Math.abs(recentLows[i] - recentLows[j]) <= tolerance) {
        eqlLevel = Math.min(recentLows[i], recentLows[j]);
        break;
      }
    }
  }

  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  if (eqlLevel !== null && prev.low < eqlLevel && prev.close > eqlLevel && current.close > current.open) {
    const entry = current.close;
    const stopLoss = prev.low - 0.3 * currentAtr;
    const risk = entry - stopLoss;
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
      confidence: 0.76, reason: `EQL sweep at ${eqlLevel.toFixed(4)}`,
      timestamp: current.timestamp, metadata: { eql: eqlLevel },
    });
  }

  if (eqhLevel !== null && prev.high > eqhLevel && prev.close < eqhLevel && current.close < current.open) {
    const entry = current.close;
    const stopLoss = prev.high + 0.3 * currentAtr;
    const risk = stopLoss - entry;
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
      confidence: 0.76, reason: `EQH sweep at ${eqhLevel.toFixed(4)}`,
      timestamp: current.timestamp, metadata: { eqh: eqhLevel },
    });
  }

  return makeSignal({ reason: "No EQH/EQL sweep" });
}
