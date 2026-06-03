import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 7. TRIX - triple-smoothed EMA rate of change
export function trix(c: Candle[]): Signal {
