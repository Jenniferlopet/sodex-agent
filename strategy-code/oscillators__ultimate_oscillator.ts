import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 6. Ultimate Oscillator - multi-timeframe (7/14/28)
export function ultimateOscillator(c: Candle[]): Signal {
