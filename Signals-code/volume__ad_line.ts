import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 2. A/D Line - Accumulation/Distribution
export function adLine(c: Candle[]): Signal {
