/**
 * Order Block Strategy
 * Last opposite-direction candle + strong impulse + retest = entry
 */
import { Candle, Signal, makeSignal, atr, ema } from "../../common";

export interface OrderBlock {
  index: number;
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  open: number;
  close: number;
}

export function detectOrderBlocks(
  candles: Candle[],
  impulseAtr = 1.5,
  lookback = 50
): OrderBlock[] {
  const atrValues = atr(candles, 14);
  const obs: OrderBlock[] = [];
  const start = Math.max(3, candles.length - lookback);

  for (let i = start; i < candles.length - 1; i++) {
    const c = candles[i];
    const next = candles[i + 1];
    const a = atrValues[i];
    if (isNaN(a)) continue;

    if (c.close < c.open) {
      const impulse = next.high - c.low;
      if (impulse >= a * impulseAtr && next.close > c.high) {
        obs.push({
          index: i,
          type: "bullish",
          top: c.high,
          bottom: c.low,
          open: c.open,
          close: c.close,
        });
      }
    } else if (c.close > c.open) {
      const impulse = c.high - next.low;
      if (impulse >= a * impulseAtr && next.close < c.low) {
        obs.push({
          index: i,
          type: "bearish",
          top: c.high,
          bottom: c.low,
          open: c.open,
          close: c.close,
        });
      }
    }
  }
  return obs;
}

export function detectOrderBlockSignal(
  candles: Candle[],
  opts: { impulseAtr?: number; useTrendFilter?: boolean; emaPeriod?: number } = {}
): Signal {
  const { impulseAtr = 1.5, useTrendFilter = true, emaPeriod = 200 } = opts;
  if (candles.length < emaPeriod + 10) return makeSignal({ reason: "Insufficient data" });

  const obs = detectOrderBlocks(candles, impulseAtr);
  if (obs.length === 0) return makeSignal({ reason: "No order block detected" });

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];
  const atrValues = atr(candles, 14);
  const currentAtr = atrValues[atrValues.length - 1];
  const emaValues = ema(closes, emaPeriod);
  const trend = currentPrice > emaValues[emaValues.length - 1] ? "up" : "down";

  for (let i = obs.length - 1; i >= 0; i--) {
    const ob = obs[i];
    if (ob.type === "bullish") {
      if (useTrendFilter && trend !== "up") continue;
      if (currentPrice <= ob.top && currentPrice >= ob.bottom) {
        const entry = (ob.top + ob.bottom) / 2;
        const stopLoss = ob.bottom - 0.5 * currentAtr;
        const risk = entry - stopLoss;
        return makeSignal({
          signal: "long",
          entry,
          stop_loss: stopLoss,
          take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
          confidence: 0.78,
          reason: `Bullish OB retest at ${entry.toFixed(4)}`,
          timestamp: candles[candles.length - 1].timestamp,
          metadata: { ob, trend },
        });
      }
    } else {
      if (useTrendFilter && trend !== "down") continue;
      if (currentPrice <= ob.top && currentPrice >= ob.bottom) {
        const entry = (ob.top + ob.bottom) / 2;
        const stopLoss = ob.top + 0.5 * currentAtr;
        const risk = stopLoss - entry;
        return makeSignal({
          signal: "short",
          entry,
          stop_loss: stopLoss,
          take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
          confidence: 0.78,
          reason: `Bearish OB retest at ${entry.toFixed(4)}`,
          timestamp: candles[candles.length - 1].timestamp,
          metadata: { ob, trend },
        });
      }
    }
  }
  return makeSignal({ reason: "No active OB retest" });
}
