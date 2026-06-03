import { Candle, Signal, makeSignal, sma, atr } from '../indicators';

// 3. Whale Buy — single candle huge volume + large green body + high close
export function whaleBuy(c: Candle[]): Signal {
