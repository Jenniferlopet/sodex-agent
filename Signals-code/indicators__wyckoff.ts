/**
 * Wyckoff Phase Detection - TypeScript
 */
import { Candle, Signal, makeSignal, atr, sma } from "../../common";

export function detectWyckoffSignal(
  candles: Candle[],
  opts: { rangeLookback?: number; volLookback?: number } = {}
): Signal {
  const { rangeLookback = 30, volLookback = 50 } = opts;
  if (candles.length < rangeLookback + volLookback) return makeSignal({ reason: "Insufficient data" });

  const i = candles.length - 1;
  const current = candles[i];
  const atrV = atr(candles, 14);
  const currentAtr = atrV[i];

  const rangeStart = candles.length - rangeLookback - 5;
  const rangeEnd = candles.length - 1;
  const rangeSlice = candles.slice(rangeStart, rangeEnd);
  const rangeHigh = Math.max(...rangeSlice.map((c) => c.high));
  const rangeLow = Math.min(...rangeSlice.map((c) => c.low));
  const rangeSize = rangeHigh - rangeLow;

  const volumes = candles.map((c) => c.volume);
  const avgVol = sma(volumes, volLookback)[i];
  const highVol = current.volume > avgVol * 1.5;

  const rangeAtrRatio = rangeSize / currentAtr;
  const isConsolidating = rangeAtrRatio < 8;
  if (!isConsolidating) return makeSignal({ reason: "No consolidation" });

  const spring =
    current.low < rangeLow &&
    current.close > rangeLow &&
    current.close > current.open &&
    highVol;

  const upthrust =
    current.high > rangeHigh &&
    current.close < rangeHigh &&
    current.close < current.open &&
    highVol;

  if (spring) {
    const entry = current.close;
    const stopLoss = current.low - 0.5 * currentAtr;
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [rangeHigh, rangeHigh + rangeSize * 0.5, rangeHigh + rangeSize * 1.0],
      confidence: 0.82, reason: "Wyckoff Spring (Phase C accumulation)",
      timestamp: current.timestamp,
      metadata: { range_high: rangeHigh, range_low: rangeLow },
    });
  }
  if (upthrust) {
    const entry = current.close;
    const stopLoss = current.high + 0.5 * currentAtr;
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [rangeLow, rangeLow - rangeSize * 0.5, rangeLow - rangeSize * 1.0],
      confidence: 0.82, reason: "Wyckoff Upthrust (Phase C distribution)",
      timestamp: current.timestamp,
      metadata: { range_high: rangeHigh, range_low: rangeLow },
    });
  }
  return makeSignal({ reason: "No spring/upthrust" });
}
