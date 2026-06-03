import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 4. ROC - Rate of Change momentum
export function roc(c: Candle[]): Signal {
