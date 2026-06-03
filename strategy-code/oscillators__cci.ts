import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 1. CCI - Commodity Channel Index, ±100 extremes
export function cci(c: Candle[]): Signal {
