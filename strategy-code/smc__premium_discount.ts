import { Candle, Signal, makeSignal, ema, atr, swingHighs, swingLows } from '../indicators';

// 9. Premium/Discount Zones (fib-based)
export function premiumDiscount(c: Candle[]): Signal {
