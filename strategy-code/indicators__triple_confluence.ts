/**
 * Triple Confluence Strategy - TypeScript
 */
import { Candle, Signal, makeSignal, ema, rsi, macd, atr } from "../../common";

export function detectTripleConfluenceSignal(
  candles: Candle[],
  opts: { emaFast?: number; emaSlow?: number; rsiPeriod?: number } = {}
): Signal {
  const { emaFast = 50, emaSlow = 200, rsiPeriod = 14 } = opts;
  if (candles.length < emaSlow + 5) return makeSignal({ reason: "Insufficient data" });

  const closes = candles.map((c) => c.close);
  const emaF = ema(closes, emaFast);
  const emaS = ema(closes, emaSlow);
  const rsiV = rsi(closes, rsiPeriod);
  const { macd: macdL, signal: sigL, histogram: hist } = macd(closes);
  const atrV = atr(candles, 14);
  const current = candles[candles.length - 1];
  const i = candles.length - 1;

  const longCond =
    emaF[i] > emaS[i] &&
    current.close > emaF[i] &&
    rsiV[i] > 50 && rsiV[i] < 70 &&
    hist[i] > 0 && macdL[i] > sigL[i] && hist[i] > hist[i - 1];

  const shortCond =
    emaF[i] < emaS[i] &&
    current.close < emaF[i] &&
    rsiV[i] > 30 && rsiV[i] < 50 &&
    hist[i] < 0 && macdL[i] < sigL[i] && hist[i] < hist[i - 1];

  if (longCond) {
    const entry = current.close;
    const stopLoss = entry - 2 * atrV[i];
    const risk = entry - stopLoss;
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
      confidence: 0.8, reason: "Triple confluence LONG",
      timestamp: current.timestamp,
      metadata: { rsi: rsiV[i], macd_hist: hist[i] },
    });
  }
  if (shortCond) {
    const entry = current.close;
    const stopLoss = entry + 2 * atrV[i];
    const risk = stopLoss - entry;
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
      confidence: 0.8, reason: "Triple confluence SHORT",
      timestamp: current.timestamp,
      metadata: { rsi: rsiV[i], macd_hist: hist[i] },
    });
  }
  return makeSignal({ reason: "No confluence" });
}
