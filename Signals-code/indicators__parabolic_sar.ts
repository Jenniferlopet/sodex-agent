import { Candle, Signal, makeSignal, ema, sma, rsi, atr, bollingerBands } from '../indicators';

// 11. Parabolic SAR
export function parabolicSar(c: Candle[]): Signal {
