import { Candle, Signal, makeSignal, ema, atr, swingHighs, swingLows } from '../indicators';

// 10. Power of 3 (PO3) - Accumulation/Manipulation/Distribution
export function powerOf3(c: Candle[]): Signal {
