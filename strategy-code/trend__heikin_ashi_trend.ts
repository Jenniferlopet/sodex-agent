import { Candle, Signal, makeSignal, ema, sma, macd, atr } from '../indicators';

// 3. Heikin Ashi Trend - HA candle color change + body strength
export function heikinAshiTrend(c: Candle[]): Signal {
