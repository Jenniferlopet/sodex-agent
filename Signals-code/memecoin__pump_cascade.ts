import { Candle, Signal, makeSignal, sma, atr } from '../indicators';

// 4. Pump Cascade — 5+ consecutive green candles, momentum building
export function pumpCascade(c: Candle[]): Signal {
