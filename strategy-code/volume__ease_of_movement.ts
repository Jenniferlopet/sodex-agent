import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 5. Ease of Movement
export function easeOfMovement(c: Candle[]): Signal {
