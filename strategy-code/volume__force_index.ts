import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 4. Force Index (Elder)
export function forceIndex(c: Candle[]): Signal {
