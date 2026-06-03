import { Candle, Signal, makeSignal, ema, sma, macd, atr } from '../indicators';

// 4. ADX Trend Rider - ADX > 25 + DI cross (Wilder DMI)
export function adxTrendRider(c: Candle[]): Signal {
