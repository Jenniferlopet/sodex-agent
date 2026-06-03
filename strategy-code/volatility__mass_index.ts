import { Candle, Signal, makeSignal, sma, ema, atr, bollingerBands } from '../indicators';

// 3. Mass Index - reversal bulge
export function massIndex(c: Candle[]): Signal {
