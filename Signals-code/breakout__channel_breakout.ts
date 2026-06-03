import { Candle, Signal, makeSignal, sma, atr, swingHighs, swingLows } from '../indicators';

// 2. Channel Breakout — break of a swing high/low channel
export function channelBreakout(c: Candle[]): Signal {
