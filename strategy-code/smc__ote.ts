/**
 * OTE - Optimal Trade Entry (Fibonacci 0.62-0.79)
 */
import { Candle, Signal, makeSignal, atr, ema, swingHighs, swingLows } from "../../common";

export function detectOTESignal(
  candles: Candle[],
  opts: {
    swingLb?: number; fibLow?: number; fibHigh?: number;
    useTrendFilter?: boolean; emaPeriod?: number;
  } = {}
): Signal {
  const { swingLb = 10, fibLow = 0.62, fibHigh = 0.79,
    useTrendFilter = true, emaPeriod = 200 } = opts;
  if (candles.length < emaPeriod + 20) return makeSignal({ reason: "Insufficient data" });

  const sh = swingHighs(candles, swingLb);
  const sl = swingLows(candles, swingLb);
  const atrValues = atr(candles, 14);
  const currentAtr = atrValues[atrValues.length - 1];
  const current = candles[candles.length - 1];
  const closes = candles.map((c) => c.close);
  const emaValues = ema(closes, emaPeriod);
  const trend = current.close > emaValues[emaValues.length - 1] ? "up" : "down";

  let lastShIdx = -1, lastSlIdx = -1, lastSh = NaN, lastSl = NaN;
  for (let i = sh.length - 1; i >= 0; i--) {
    if (sh[i] !== null && lastShIdx === -1) { lastShIdx = i; lastSh = sh[i] as number; }
    if (sl[i] !== null && lastSlIdx === -1) { lastSlIdx = i; lastSl = sl[i] as number; }
    if (lastShIdx !== -1 && lastSlIdx !== -1) break;
  }
  if (isNaN(lastSh) || isNaN(lastSl)) return makeSignal({ reason: "No swing structure" });

  if (lastShIdx > lastSlIdx) {
    const impulseLow = lastSl, impulseHigh = lastSh;
    const oteLow = impulseHigh - (impulseHigh - impulseLow) * fibHigh;
    const oteHigh = impulseHigh - (impulseHigh - impulseLow) * fibLow;
    if (current.close >= oteLow && current.close <= oteHigh) {
      if (useTrendFilter && trend !== "up") return makeSignal({ reason: "OTE but trend opposite" });
      const entry = (oteLow + oteHigh) / 2;
      const stopLoss = impulseLow - 0.3 * currentAtr;
      const risk = entry - stopLoss;
      return makeSignal({
        signal: "long", entry, stop_loss: stopLoss,
        take_profit: [entry + risk * 2, entry + risk * 3, impulseHigh],
        confidence: 0.77, reason: `OTE long ${fibLow}-${fibHigh}`,
        timestamp: current.timestamp,
        metadata: { impulse_low: impulseLow, impulse_high: impulseHigh },
      });
    }
  } else {
    const impulseHigh = lastSh, impulseLow = lastSl;
    const oteLow = impulseLow + (impulseHigh - impulseLow) * fibLow;
    const oteHigh = impulseLow + (impulseHigh - impulseLow) * fibHigh;
    if (current.close >= oteLow && current.close <= oteHigh) {
      if (useTrendFilter && trend !== "down") return makeSignal({ reason: "OTE but trend opposite" });
      const entry = (oteLow + oteHigh) / 2;
      const stopLoss = impulseHigh + 0.3 * currentAtr;
      const risk = stopLoss - entry;
      return makeSignal({
        signal: "short", entry, stop_loss: stopLoss,
        take_profit: [entry - risk * 2, entry - risk * 3, impulseLow],
        confidence: 0.77, reason: `OTE short ${fibLow}-${fibHigh}`,
        timestamp: current.timestamp,
        metadata: { impulse_low: impulseLow, impulse_high: impulseHigh },
      });
    }
  }
  return makeSignal({ reason: "Price not in OTE zone" });
}
