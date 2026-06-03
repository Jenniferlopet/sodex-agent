import { Candle, Signal, makeSignal, atr } from '../indicators';

// 1. Z-Score Mean Reversion — 20-period rolling mean ± 2σ
export function zScoreReversion(c: Candle[]): Signal {
