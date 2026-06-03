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

// 7. Bull Flag - güçlü impulse + dar geri çekilme + kırılım
export function bullFlag(c: Candle[]): Signal {
