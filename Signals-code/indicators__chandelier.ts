/**
 * Chandelier Exit Strategy - TypeScript
 */
import { Candle, Signal, makeSignal, atr, ema } from "../../common";

export function detectChandelierSignal(
  candles: Candle[],
  opts: { period?: number; multiplier?: number; useTrendFilter?: boolean; emaPeriod?: number } = {}
): Signal {
  const { period = 22, multiplier = 3, useTrendFilter = true, emaPeriod = 200 } = opts;
  if (candles.length < Math.max(period, emaPeriod) + 5)
    return makeSignal({ reason: "Insufficient data" });

  const atrV = atr(candles, period);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const closes = candles.map((c) => c.close);

  const longStop: number[] = [];
  const shortStop: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { longStop.push(NaN); shortStop.push(NaN); continue; }
    const maxH = Math.max(...highs.slice(i - period + 1, i + 1));
    const minL = Math.min(...lows.slice(i - period + 1, i + 1));
    longStop.push(maxH - atrV[i] * multiplier);
    shortStop.push(minL + atrV[i] * multiplier);
  }

  const emaV = ema(closes, emaPeriod);
  const i = candles.length - 1;
  const current = candles[i];
  const prev = candles[i - 1];

  const longBreakout = current.close > shortStop[i] && prev.close <= shortStop[i - 1];
  const shortBreakout = current.close < longStop[i] && prev.close >= longStop[i - 1];

  if (longBreakout) {
    if (useTrendFilter && current.close < emaV[i]) return makeSignal({ reason: "Long but downtrend" });
    const entry = current.close;
    const stopLoss = longStop[i];
    const risk = entry - stopLoss;
    if (risk <= 0) return makeSignal({ reason: "Invalid risk" });
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
      confidence: 0.7, reason: "Chandelier long breakout",
      timestamp: current.timestamp, metadata: { long_stop: stopLoss },
    });
  }
  if (shortBreakout) {
    if (useTrendFilter && current.close > emaV[i]) return makeSignal({ reason: "Short but uptrend" });
    const entry = current.close;
    const stopLoss = shortStop[i];
    const risk = stopLoss - entry;
    if (risk <= 0) return makeSignal({ reason: "Invalid risk" });
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
      confidence: 0.7, reason: "Chandelier short breakout",
      timestamp: current.timestamp, metadata: { short_stop: stopLoss },
    });
  }
  return makeSignal({ reason: "No chandelier breakout" });
}
