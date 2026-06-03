// Strategy Lab - Volume Surge Detection (Memecoin)
import { makeSignal, Signal, Candle, atr, validateOhlcv } from "../../common";

export interface VolSurgeConfig {
  surge_multiplier?: number;
  volume_lookback?: number;
  sl_atr_mult?: number;
  rr_targets?: [number, number, number];
}

export function checkSignal(candles: Candle[], cfg: VolSurgeConfig = {}): Signal {
  const mult     = cfg.surge_multiplier ?? 3.0;
  const lookback = cfg.volume_lookback ?? 20;
  const slMul    = cfg.sl_atr_mult ?? 1.5;
  const [rr1, rr2, rr3] = cfg.rr_targets ?? [2.0, 3.5, 5.0];

  if (!validateOhlcv(candles, lookback + 5))
    return makeSignal("neutral", 0, 0, [], 0, "Not enough candles");

  const vols   = candles.map(c => c.volume);
  const closes = candles.map(c => c.close);
  const opens  = candles.map(c => c.open);

  const window = vols.slice(-lookback-1, -1);
  const avgV = window.reduce((a,b)=>a+b,0) / window.length;
  const nowV = vols[vols.length-1];

  if (nowV < avgV * mult)
    return makeSignal("neutral", closes[closes.length-1], 0, [], 0,
                     `No surge (${(nowV/Math.max(avgV,1)).toFixed(2)}x)`);

  const bull = closes[closes.length-1] > opens[opens.length-1];
  const atrArr = atr(candles, 14);
  const a = atrArr[atrArr.length - 1];
  const price = closes[closes.length-1];

  if (!bull)
    return makeSignal("neutral", price, 0, [], 0, "Volume surge on red - avoid");

  const sl = price - a * slMul;
  const risk = price - sl;
  const conf = Math.min(0.5 + (nowV/avgV - mult) * 0.05 + 0.2, 0.95);

  return makeSignal("long", price, sl,
                    [price + risk*rr1, price + risk*rr2, price + risk*rr3],
                    conf,
                    `Volume surge ${(nowV/avgV).toFixed(2)}x avg, bullish candle`,
                    { surge_ratio: nowV/avgV });
}
