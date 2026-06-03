/**
 * Supertrend + ADX Strategy - TypeScript
 */
import { Candle, Signal, makeSignal, atr } from "../../common";

function calcAdx(candles: Candle[], period = 14): number[] {
  const result: number[] = new Array(candles.length).fill(NaN);
  if (candles.length < period * 2) return result;
  const plusDm: number[] = [0];
  const minusDm: number[] = [0];
  const trs: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const dnMove = candles[i - 1].low - candles[i].low;
    plusDm.push(upMove > dnMove && upMove > 0 ? upMove : 0);
    minusDm.push(dnMove > upMove && dnMove > 0 ? dnMove : 0);
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    ));
  }
  let smPlus = plusDm.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smMinus = minusDm.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smTr = trs.slice(1, period + 1).reduce((a, b) => a + b, 0);
  const dxArr: number[] = [];
  for (let i = period; i < candles.length; i++) {
    if (i > period) {
      smPlus = smPlus - smPlus / period + plusDm[i];
      smMinus = smMinus - smMinus / period + minusDm[i];
      smTr = smTr - smTr / period + trs[i];
    }
    const plusDi = 100 * (smPlus / (smTr || 1e-10));
    const minusDi = 100 * (smMinus / (smTr || 1e-10));
    const dx = 100 * (Math.abs(plusDi - minusDi) / ((plusDi + minusDi) || 1e-10));
    dxArr.push(dx);
  }
  // ADX = SMA of DX
  for (let i = 0; i < dxArr.length; i++) {
    if (i < period - 1) continue;
    const slice = dxArr.slice(i - period + 1, i + 1);
    result[i + period] = slice.reduce((a, b) => a + b, 0) / period;
  }
  return result;
}

export function calcSupertrend(candles: Candle[], period = 10, multiplier = 3): { st: number[]; dir: number[] } {
  const atrV = atr(candles, period);
  const st: number[] = new Array(candles.length).fill(NaN);
  const dir: number[] = new Array(candles.length).fill(0);
  for (let i = 0; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const ub = hl2 + multiplier * atrV[i];
    const lb = hl2 - multiplier * atrV[i];
    if (i === 0) { st[i] = ub; dir[i] = -1; continue; }
    if (candles[i - 1].close > st[i - 1]) {
      st[i] = Math.max(lb, st[i - 1]);
      if (candles[i].close < st[i]) { st[i] = ub; dir[i] = -1; }
      else dir[i] = 1;
    } else {
      st[i] = Math.min(ub, st[i - 1]);
      if (candles[i].close > st[i]) { st[i] = lb; dir[i] = 1; }
      else dir[i] = -1;
    }
  }
  return { st, dir };
}

export function detectSupertrendAdxSignal(
  candles: Candle[],
  opts: { stPeriod?: number; stMult?: number; adxPeriod?: number; adxThreshold?: number } = {}
): Signal {
  const { stPeriod = 10, stMult = 3, adxPeriod = 14, adxThreshold = 25 } = opts;
  if (candles.length < Math.max(stPeriod, adxPeriod) * 3) return makeSignal({ reason: "Insufficient data" });

  const { st, dir } = calcSupertrend(candles, stPeriod, stMult);
  const adxV = calcAdx(candles, adxPeriod);
  const i = candles.length - 1;
  const current = candles[i];
  const atrV = atr(candles, 14);

  const flippedUp = dir[i] === 1 && dir[i - 1] === -1;
  const flippedDn = dir[i] === -1 && dir[i - 1] === 1;
  const adxStrong = adxV[i] > adxThreshold;

  if (flippedUp && adxStrong) {
    const entry = current.close;
    const stopLoss = st[i];
    const risk = entry - stopLoss;
    if (risk <= 0) return makeSignal({ reason: "Invalid risk" });
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
      confidence: 0.78, reason: `Supertrend flip up + ADX ${adxV[i].toFixed(1)}`,
      timestamp: current.timestamp, metadata: { adx: adxV[i] },
    });
  }
  if (flippedDn && adxStrong) {
    const entry = current.close;
    const stopLoss = st[i];
    const risk = stopLoss - entry;
    if (risk <= 0) return makeSignal({ reason: "Invalid risk" });
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
      confidence: 0.78, reason: `Supertrend flip down + ADX ${adxV[i].toFixed(1)}`,
      timestamp: current.timestamp, metadata: { adx: adxV[i] },
    });
  }
  return makeSignal({ reason: "No supertrend flip with strong ADX" });
}
