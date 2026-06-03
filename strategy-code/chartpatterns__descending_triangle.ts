import { Candle, Signal, makeSignal, atr, sma, swingHighs, swingLows } from '../indicators';

function pivots(c: Candle[], lb = 5) {
  const sh = swingHighs(c, lb), sl = swingLows(c, lb);
  const highs: { idx: number; price: number }[] = [], lows: { idx: number; price: number }[] = [];
  for (let i = 0; i < c.length; i++) {
    if (sh[i] !== null) highs.push({ idx: i, price: sh[i] as number });
    if (sl[i] !== null) lows.push({ idx: i, price: sl[i] as number });
  }
  return { highs, lows };
}

// 6. Descending Triangle - düz dip + alçalan tepeler
export function descendingTriangle(c: Candle[]): Signal {
