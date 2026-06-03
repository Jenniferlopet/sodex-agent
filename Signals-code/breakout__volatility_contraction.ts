import { Candle, Signal, makeSignal, sma, atr, swingHighs, swingLows } from '../indicators';

// 3. Volatility Contraction Pattern (VCP) — tightening range + breakout (Minervini)
export function volatilityContraction(c: Candle[]): Signal {
