/**
 * Breaker Block Strategy
 */
import { Candle, Signal, makeSignal, atr, ema } from "../../common";
import { detectOrderBlocks } from "./order_block";

export function detectBreakerSignal(
  candles: Candle[],
  opts: { useTrendFilter?: boolean; emaPeriod?: number } = {}
): Signal {
  const { useTrendFilter = true, emaPeriod = 200 } = opts;
  if (candles.length < emaPeriod + 20) return makeSignal({ reason: "Insufficient data" });

  const obs = detectOrderBlocks(candles, 1.2, 80);
  const atrValues = atr(candles, 14);
  const currentAtr = atrValues[atrValues.length - 1];
  const current = candles[candles.length - 1];
  const closes = candles.map((c) => c.close);
  const emaValues = ema(closes, emaPeriod);
  const trend = current.close > emaValues[emaValues.length - 1] ? "up" : "down";

  for (const ob of obs) {
    const post = candles.slice(ob.index + 2);
    if (ob.type === "bullish") {
      const broken = post.some((c) => c.close < ob.bottom);
      if (broken && current.high >= ob.bottom && current.low <= ob.top) {
        if (useTrendFilter && trend !== "down") continue;
        const entry = (ob.top + ob.bottom) / 2;
        const stopLoss = ob.top + 0.5 * currentAtr;
        const risk = stopLoss - entry;
        return makeSignal({
          signal: "short", entry, stop_loss: stopLoss,
          take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
          confidence: 0.74, reason: "Bearish breaker (failed bullish OB)",
          timestamp: current.timestamp, metadata: { original_ob: ob },
        });
      }
    } else {
      const broken = post.some((c) => c.close > ob.top);
      if (broken && current.high >= ob.bottom && current.low <= ob.top) {
        if (useTrendFilter && trend !== "up") continue;
        const entry = (ob.top + ob.bottom) / 2;
        const stopLoss = ob.bottom - 0.5 * currentAtr;
        const risk = entry - stopLoss;
        return makeSignal({
          signal: "long", entry, stop_loss: stopLoss,
          take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
          confidence: 0.74, reason: "Bullish breaker (failed bearish OB)",
          timestamp: current.timestamp, metadata: { original_ob: ob },
        });
      }
    }
  }
  return makeSignal({ reason: "No breaker setup" });
}
