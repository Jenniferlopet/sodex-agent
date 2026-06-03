import { Candle, Signal, makeSignal, sma, ema, atr, bollingerBands } from '../indicators';

// 6. Bollinger Bandwidth Expansion
export function bollingerBandwidth(c: Candle[]): Signal {
