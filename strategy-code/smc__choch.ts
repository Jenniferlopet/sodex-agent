import { Candle, Signal, makeSignal, ema, atr, swingHighs, swingLows } from '../indicators';

// 8. ChoCH (Change of Character) - market structure shift
export function chochSignal(c: Candle[]): Signal {
