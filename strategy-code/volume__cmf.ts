import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 3. Chaikin Money Flow
export function cmf(c: Candle[]): Signal {
