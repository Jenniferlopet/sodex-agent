import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 8. VWMA Cross - Volume Weighted MA vs SMA
export function vwmaCross(c: Candle[]): Signal {
