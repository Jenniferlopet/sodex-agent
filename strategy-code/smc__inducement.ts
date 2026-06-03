/**
 * Inducement & Mitigation Strategy
 */
import { Candle, Signal, makeSignal, atr, swingHighs, swingLows } from "../../common";

export function detectInducementSignal(candles: Candle[], swingLb = 8): Signal {
  if (candles.length < swingLb * 3) return makeSignal({ reason: "Insufficient data" });

  const sh = swingHighs(candles, swingLb).filter((v): v is number => v !== null);
  const sl = swingLows(candles, swingLb).filter((v): v is number => v !== null);
  if (sh.length < 2 || sl.length < 2) return makeSignal({ reason: "No structure" });

  const atrValues = atr(candles, 14);
  const currentAtr = atrValues[atrValues.length - 1];
  const current = candles[candles.length - 1];
  const last3 = candles.slice(-4, -1);
  const lastLow = sl[sl.length - 1];
  const lastHigh = sh[sh.length - 1];

  const wickBelow = last3.some((c) => c.low < lastLow && c.close > lastLow);
  const max3High = Math.max(...last3.map((c) => c.high));
  const rejected = current.close > current.open && current.close > max3High;
  if (wickBelow && rejected) {
    const min3Low = Math.min(...last3.map((c) => c.low));
    const entry = current.close;
    const stopLoss = min3Low - 0.3 * currentAtr;
    const risk = entry - stopLoss;
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
      confidence: 0.7, reason: "Bullish inducement + mitigation",
      timestamp: current.timestamp,
    });
  }

  const wickAbove = last3.some((c) => c.high > lastHigh && c.close < lastHigh);
  const min3Low = Math.min(...last3.map((c) => c.low));
  const rejectedDn = current.close < current.open && current.close < min3Low;
  if (wickAbove && rejectedDn) {
    const max3HighB = Math.max(...last3.map((c) => c.high));
    const entry = current.close;
    const stopLoss = max3HighB + 0.3 * currentAtr;
    const risk = stopLoss - entry;
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
      confidence: 0.7, reason: "Bearish inducement + mitigation",
      timestamp: current.timestamp,
    });
  }

  return makeSignal({ reason: "No inducement setup" });
}
