import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 8. Coppock Curve - long-term momentum
export function coppock(c: Candle[]): Signal {
