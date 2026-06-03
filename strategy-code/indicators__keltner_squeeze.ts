import { Candle, Signal, makeSignal, ema, sma, rsi, atr, bollingerBands } from '../indicators';

// 12. Keltner Channel Squeeze (BB inside Keltner = squeeze)
export function keltnerSqueeze(c: Candle[]): Signal {
