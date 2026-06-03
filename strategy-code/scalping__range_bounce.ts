import { Candle, Signal, makeSignal, atr } from '../indicators';

// 2. Range Bounce — support/resistance bounce in tight range
export function rangeBounce(c: Candle[]): Signal {
