import { Candle, Signal, makeSignal, sma, atr, swingHighs, swingLows } from '../indicators';

// 1. Opening Range Breakout (ORB) — early range, break beyond it
export function openingRangeBreakout(c: Candle[]): Signal {
