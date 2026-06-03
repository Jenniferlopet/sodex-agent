import { Candle, Signal, makeSignal, rsi, atr } from '../indicators';

// 1. Quick Scalp RSI — short-term RSI extreme bounce
export function quickScalp(c: Candle[]): Signal {
