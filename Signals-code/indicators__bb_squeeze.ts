/**
 * Bollinger Squeeze Breakout - TypeScript
 */
import { Candle, Signal, makeSignal, bollingerBands, atr, sma } from "../../common";

export function detectBbSqueezeSignal(
  candles: Candle[],
  opts: {
    bbPeriod?: number; bbStd?: number;
    squeezeLookback?: number; useVolumeFilter?: boolean;
  } = {}
): Signal {
  const { bbPeriod = 20, bbStd = 2, squeezeLookback = 50, useVolumeFilter = true } = opts;
  if (candles.length < bbPeriod + squeezeLookback) return makeSignal({ reason: "Insufficient data" });

  const closes = candles.map((c) => c.close);
  const { upper, middle, lower } = bollingerBands(closes, bbPeriod, bbStd);
  const width = upper.map((u, i) => (u - lower[i]) / middle[i]);
  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const i = candles.length - 1;

  const widthRecent = width.slice(-squeezeLookback).filter((v) => !isNaN(v)).sort((a, b) => a - b);
  const q25 = widthRecent[Math.floor(widthRecent.length * 0.25)];
  const wasSqueeze = width.slice(-5, -1).every((v) => v < q25);

  const volumes = candles.map((c) => c.volume);
  const avgVol = sma(volumes, 20)[i];
  const volOk = !useVolumeFilter || current.volume > avgVol * 1.2;

  if (wasSqueeze && current.close > upper[i] && prev.close <= upper[i - 1] && volOk) {
    const entry = current.close;
    const stopLoss = middle[i];
    const risk = entry - stopLoss;
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
      confidence: 0.75, reason: "BB squeeze breakout UP",
      timestamp: current.timestamp, metadata: { width: width[i] },
    });
  }
  if (wasSqueeze && current.close < lower[i] && prev.close >= lower[i - 1] && volOk) {
    const entry = current.close;
    const stopLoss = middle[i];
    const risk = stopLoss - entry;
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
      confidence: 0.75, reason: "BB squeeze breakout DOWN",
      timestamp: current.timestamp, metadata: { width: width[i] },
    });
  }
  return makeSignal({ reason: "No squeeze breakout" });
}
