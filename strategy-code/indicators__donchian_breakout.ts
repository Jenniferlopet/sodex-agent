import { Candle, Signal, makeSignal, ema, sma, rsi, atr, bollingerBands } from '../indicators';

// 10. Donchian Channel Breakout (20-period)
export function donchianBreakout(c: Candle[]): Signal {
