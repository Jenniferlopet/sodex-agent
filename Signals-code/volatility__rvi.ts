import { Candle, Signal, makeSignal, sma, ema, atr, bollingerBands } from '../indicators';

// 4. RVI - Relative Volatility Index
export function rvi(c: Candle[]): Signal {
