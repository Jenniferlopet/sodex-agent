/**
 * Ichimoku Cloud Breakout - TypeScript
 */
import { Candle, Signal, makeSignal, atr } from "../../common";

function rollingMax(arr: number[], period: number): number[] {
  return arr.map((_, i) => {
    if (i < period - 1) return NaN;
    return Math.max(...arr.slice(i - period + 1, i + 1));
  });
}
function rollingMin(arr: number[], period: number): number[] {
  return arr.map((_, i) => {
    if (i < period - 1) return NaN;
    return Math.min(...arr.slice(i - period + 1, i + 1));
  });
}

export function detectIchimokuSignal(candles: Candle[]): Signal {
  if (candles.length < 100) return makeSignal({ reason: "Insufficient data" });

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const tenkan = rollingMax(highs, 9).map((h, i) => (h + rollingMin(lows, 9)[i]) / 2);
  const kijun = rollingMax(highs, 26).map((h, i) => (h + rollingMin(lows, 26)[i]) / 2);
  const senkouA = tenkan.map((t, i) => (t + kijun[i]) / 2);
  const senkouB = rollingMax(highs, 52).map((h, i) => (h + rollingMin(lows, 52)[i]) / 2);

  // Shift cloud forward by 26 (use current cloud at i)
  const i = candles.length - 1;
  const sa = senkouA[Math.max(0, i - 26)];
  const sb = senkouB[Math.max(0, i - 26)];
  const cloudTop = Math.max(sa, sb);
  const cloudBot = Math.min(sa, sb);
  const kumoGreen = sa > sb;

  const current = candles[i];
  const atrV = atr(candles, 14);
  const tkCrossUp = tenkan[i] > kijun[i] && tenkan[i - 1] <= kijun[i - 1];
  const tkCrossDn = tenkan[i] < kijun[i] && tenkan[i - 1] >= kijun[i - 1];

  if (current.close > cloudTop && tkCrossUp && kumoGreen) {
    const entry = current.close;
    const stopLoss = kijun[i];
    const risk = entry - stopLoss;
    if (risk <= 0) return makeSignal({ reason: "Invalid risk" });
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
      confidence: 0.8, reason: "Ichimoku full bullish",
      timestamp: current.timestamp,
      metadata: { tenkan: tenkan[i], kijun: kijun[i] },
    });
  }
  if (current.close < cloudBot && tkCrossDn && !kumoGreen) {
    const entry = current.close;
    const stopLoss = kijun[i];
    const risk = stopLoss - entry;
    if (risk <= 0) return makeSignal({ reason: "Invalid risk" });
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
      confidence: 0.8, reason: "Ichimoku full bearish",
      timestamp: current.timestamp,
      metadata: { tenkan: tenkan[i], kijun: kijun[i] },
    });
  }
  return makeSignal({ reason: "Ichimoku not aligned" });
}
