import { Candle, Signal, makeSignal, rsi, atr } from '../indicators';

// 2. RSI Extreme Reversal — RSI <20 long, >80 short
export function rsiExtreme(c: Candle[]): Signal {
