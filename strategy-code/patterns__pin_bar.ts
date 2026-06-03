import { Candle, Signal, makeSignal, atr, sma, rsi } from '../indicators';

// Helper: candle metrics
function body(c: Candle) { return Math.abs(c.close - c.open); }
function range(c: Candle) { return c.high - c.low; }
function upperWick(c: Candle) { return c.high - Math.max(c.open, c.close); }
function lowerWick(c: Candle) { return Math.min(c.open, c.close) - c.low; }
function isGreen(c: Candle) { return c.close > c.open; }
function isRed(c: Candle) { return c.close < c.open; }

// 2. Pin Bar — Hammer (bullish) / Shooting Star (bearish)
export function pinBar(c: Candle[]): Signal {
