import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 1. OBV Trend - On-Balance Volume + slope
export function obvTrend(c: Candle[]): Signal {
