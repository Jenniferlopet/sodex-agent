import { Candle, Signal, makeSignal, sma, atr } from '../indicators';

// 3. Momentum Burst — single candle ATR×2+ move + volume spike (intraday breakout)
export function momentumBurst(c: Candle[]): Signal {
