import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 5. Awesome Oscillator - zero-line cross
export function awesomeOscillator(c: Candle[]): Signal {
