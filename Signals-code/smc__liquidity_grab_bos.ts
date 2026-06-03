/**
 * Liquidity Grab + Break of Structure Strategy
 */
import { Candle, Signal, makeSignal, atr, swingHighs, swingLows } from "../../common";

export function detectLiquidityGrabBosSignal(
  candles: Candle[],
  opts: { swingLookback?: number; grabAtr?: number } = {}
): Signal {
  const { swingLookback = 10 } = opts;
  if (candles.length < swingLookback * 3) return makeSignal({ reason: "Insufficient data" });

  const sh = swingHighs(candles, swingLookback).filter((v): v is number => v !== null);
  const sl = swingLows(candles, swingLookback).filter((v): v is number => v !== null);
  if (sh.length < 2 || sl.length < 2) return makeSignal({ reason: "No clear structure" });

  const atrValues = atr(candles, 14);
  const currentAtr = atrValues[atrValues.length - 1];
  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const lastSwingHigh = sh[sh.length - 1];
  const lastSwingLow = sl[sl.length - 1];

  const grabbedLow = prev.low < lastSwingLow && prev.close > lastSwingLow;
  const bosUp = current.close > lastSwingHigh;
  if (grabbedLow && bosUp) {
    const entry = current.close;
    const stopLoss = prev.low - 0.3 * currentAtr;
    const risk = entry - stopLoss;
    return makeSignal({
      signal: "long",
      entry,
      stop_loss: stopLoss,
      take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
      confidence: 0.82,
      reason: "Liquidity grab below swing low + BOS up",
      timestamp: current.timestamp,
      metadata: { grabbed_level: lastSwingLow, bos_level: lastSwingHigh },
    });
  }

  const grabbedHigh = prev.high > lastSwingHigh && prev.close < lastSwingHigh;
  const bosDn = current.close < lastSwingLow;
  if (grabbedHigh && bosDn) {
    const entry = current.close;
    const stopLoss = prev.high + 0.3 * currentAtr;
    const risk = stopLoss - entry;
    return makeSignal({
      signal: "short",
      entry,
      stop_loss: stopLoss,
      take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
      confidence: 0.82,
      reason: "Liquidity grab above swing high + BOS down",
      timestamp: current.timestamp,
      metadata: { grabbed_level: lastSwingHigh, bos_level: lastSwingLow },
    });
  }

  return makeSignal({ reason: "No liquidity grab + BOS setup" });
}
