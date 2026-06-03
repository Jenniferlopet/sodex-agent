/**
 * RSI Divergence Strategy - TypeScript
 */
import { Candle, Signal, makeSignal, rsi, atr, swingHighs, swingLows } from "../../common";

export function detectRsiDivergenceSignal(
  candles: Candle[],
  opts: { rsiPeriod?: number; swingLb?: number } = {}
): Signal {
  const { rsiPeriod = 14, swingLb = 5 } = opts;
  if (candles.length < rsiPeriod + 30) return makeSignal({ reason: "Insufficient data" });

  const closes = candles.map((c) => c.close);
  const rsiV = rsi(closes, rsiPeriod);
  const sh = swingHighs(candles, swingLb);
  const sl = swingLows(candles, swingLb);

  const lowIndices: number[] = [];
  const highIndices: number[] = [];
  sl.forEach((v, i) => v !== null && lowIndices.push(i));
  sh.forEach((v, i) => v !== null && highIndices.push(i));

  if (lowIndices.length < 2 || highIndices.length < 2)
    return makeSignal({ reason: "Not enough swings" });

  const lastLow1 = lowIndices[lowIndices.length - 2];
  const lastLow2 = lowIndices[lowIndices.length - 1];
  const lastHigh1 = highIndices[highIndices.length - 2];
  const lastHigh2 = highIndices[highIndices.length - 1];

  const current = candles[candles.length - 1];
  const atrV = atr(candles, 14);
  const ai = atrV.length - 1;

  // Regular bullish: lower low in price, higher low in RSI
  if (
    candles[lastLow2].low < candles[lastLow1].low &&
    rsiV[lastLow2] > rsiV[lastLow1] &&
    rsiV[lastLow2] < 40
  ) {
    const entry = current.close;
    const stopLoss = candles[lastLow2].low - 0.3 * atrV[ai];
    const risk = entry - stopLoss;
    if (risk > 0)
      return makeSignal({
        signal: "long", entry, stop_loss: stopLoss,
        take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
        confidence: 0.78, reason: "Regular bullish RSI divergence",
        timestamp: current.timestamp, metadata: { rsi_now: rsiV[ai] },
      });
  }

  if (
    candles[lastHigh2].high > candles[lastHigh1].high &&
    rsiV[lastHigh2] < rsiV[lastHigh1] &&
    rsiV[lastHigh2] > 60
  ) {
    const entry = current.close;
    const stopLoss = candles[lastHigh2].high + 0.3 * atrV[ai];
    const risk = stopLoss - entry;
    if (risk > 0)
      return makeSignal({
        signal: "short", entry, stop_loss: stopLoss,
        take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
        confidence: 0.78, reason: "Regular bearish RSI divergence",
        timestamp: current.timestamp, metadata: { rsi_now: rsiV[ai] },
      });
  }
  return makeSignal({ reason: "No RSI divergence" });
}
