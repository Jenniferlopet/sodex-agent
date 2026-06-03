import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 2. Williams %R
export function williamsR(c: Candle[]): Signal {
