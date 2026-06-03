import { Candle, Signal, makeSignal, sma, ema, atr } from '../indicators';

// 3. MFI - Money Flow Index (volume-weighted RSI)
export function mfi(c: Candle[]): Signal {
