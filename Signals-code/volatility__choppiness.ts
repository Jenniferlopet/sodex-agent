import { Candle, Signal, makeSignal, sma, ema, atr, bollingerBands } from '../indicators';

// 2. Choppiness Index - trend vs range (filter + breakout)
export function choppiness(c: Candle[]): Signal {
