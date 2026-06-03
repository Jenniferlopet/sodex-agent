import { Candle, Signal, makeSignal, atr, bollingerBands } from '../indicators';

// 3. BB Mean Reversion — upper/lower band touch → middle band target
export function bbMeanReversion(c: Candle[]): Signal {
