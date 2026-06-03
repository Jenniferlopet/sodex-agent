/**
 * FVG (Fair Value Gap) Strategy
 * =============================
 * Detects 3-candle liquidity gap, entry on mitigation.
 *
 * BULLISH FVG: candle[i-2].high < candle[i].low
 * BEARISH FVG: candle[i-2].low > candle[i].high
 */
import { Candle, Signal, makeSignal, atr, ema } from "../../common";

export interface FVG {
  index: number;
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  midpoint: number;
  filled: boolean;
}

export function detectFVGs(candles: Candle[], minGapAtr = 0.3): FVG[] {
  const atrValues = atr(candles, 14);
  const fvgs: FVG[] = [];

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c3 = candles[i];
    const currentAtr = atrValues[i];
    if (isNaN(currentAtr)) continue;

    // Bullish FVG
    if (c1.high < c3.low) {
      const gap = c3.low - c1.high;
      if (gap >= currentAtr * minGapAtr) {
        fvgs.push({
          index: i,
          type: "bullish",
          top: c3.low,
          bottom: c1.high,
          midpoint: (c3.low + c1.high) / 2,
          filled: false,
        });
      }
    }
    // Bearish FVG
    else if (c1.low > c3.high) {
      const gap = c1.low - c3.high;
      if (gap >= currentAtr * minGapAtr) {
        fvgs.push({
          index: i,
          type: "bearish",
          top: c1.low,
          bottom: c3.high,
          midpoint: (c1.low + c3.high) / 2,
          filled: false,
        });
      }
    }
  }
  return fvgs;
}

export interface FVGOptions {
  minGapAtr?: number;
  useTrendFilter?: boolean;
  emaPeriod?: number;
}

export function detectFVGSignal(candles: Candle[], opts: FVGOptions = {}): Signal {
  const { minGapAtr = 0.3, useTrendFilter = true, emaPeriod = 200 } = opts;

  if (candles.length < emaPeriod + 5) {
    return makeSignal({ reason: "Insufficient data" });
  }

  const fvgs = detectFVGs(candles, minGapAtr);
  if (fvgs.length === 0) {
    return makeSignal({ reason: "No FVG detected" });
  }

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];
  const atrValues = atr(candles, 14);
  const currentAtr = atrValues[atrValues.length - 1];
  const emaValues = ema(closes, emaPeriod);
  const trendEma = emaValues[emaValues.length - 1];
  const trend = currentPrice > trendEma ? "up" : "down";

  for (let i = fvgs.length - 1; i >= 0; i--) {
    const fvg = fvgs[i];
    if (fvg.filled) continue;

    if (fvg.type === "bullish") {
      const recent = candles.slice(fvg.index + 1);
      if (recent.length === 0) continue;
      const touched = recent.some((c) => c.low <= fvg.midpoint);
      if (!touched) continue;
      if (useTrendFilter && trend !== "up") continue;
      if (currentPrice > fvg.bottom && currentPrice < fvg.top) {
        const entry = fvg.midpoint;
        const stopLoss = fvg.bottom - 0.5 * currentAtr;
        const risk = entry - stopLoss;
        return makeSignal({
          signal: "long",
          entry,
          stop_loss: stopLoss,
          take_profit: [entry + risk * 2, entry + risk * 3, entry + risk * 5],
          confidence: useTrendFilter ? 0.75 : 0.6,
          reason: `Bullish FVG mitigation at ${fvg.midpoint.toFixed(4)}`,
          timestamp: candles[candles.length - 1].timestamp,
          metadata: { fvg, trend },
        });
      }
    } else {
      const recent = candles.slice(fvg.index + 1);
      if (recent.length === 0) continue;
      const touched = recent.some((c) => c.high >= fvg.midpoint);
      if (!touched) continue;
      if (useTrendFilter && trend !== "down") continue;
      if (currentPrice > fvg.bottom && currentPrice < fvg.top) {
        const entry = fvg.midpoint;
        const stopLoss = fvg.top + 0.5 * currentAtr;
        const risk = stopLoss - entry;
        return makeSignal({
          signal: "short",
          entry,
          stop_loss: stopLoss,
          take_profit: [entry - risk * 2, entry - risk * 3, entry - risk * 5],
          confidence: useTrendFilter ? 0.75 : 0.6,
          reason: `Bearish FVG mitigation at ${fvg.midpoint.toFixed(4)}`,
          timestamp: candles[candles.length - 1].timestamp,
          metadata: { fvg, trend },
        });
      }
    }
  }

  return makeSignal({ reason: "No active FVG entry" });
}
