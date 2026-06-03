import { Candle, Signal, makeSignal, ema, sma, macd, atr } from '../indicators';

// 2. MACD Zero Cross - MACD line crosses the zero line (strong trend confirmation)
export function macdZeroCross(c: Candle[]): Signal {
