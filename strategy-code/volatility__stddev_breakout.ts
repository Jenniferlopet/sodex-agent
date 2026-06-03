import { Candle, Signal, makeSignal, sma, ema, atr, bollingerBands } from '../indicators';

// 5. Standard Deviation Breakout - volatility expansion
export function stdDevBreakout(c: Candle[]): Signal {
