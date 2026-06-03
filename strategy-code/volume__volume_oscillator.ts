import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 6. Volume Oscillator - fast/slow volume MA
export function volumeOscillator(c: Candle[]): Signal {
