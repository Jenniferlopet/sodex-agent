import { Candle, Signal, makeSignal, sma, ema, atr, bollingerBands } from '../indicators';

// 1. ATR Channel Breakout - EMA ± ATR×mult
export function atrChannel(c: Candle[]): Signal {
