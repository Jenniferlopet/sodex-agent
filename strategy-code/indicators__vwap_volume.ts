/**
 * VWAP + Volume Profile Strategy - TypeScript
 */
import { Candle, Signal, makeSignal, vwap, atr, sma } from "../../common";

export function calcVolumeProfile(candles: Candle[], bins = 30) {
  const lows = candles.map((c) => c.low);
  const highs = candles.map((c) => c.high);
  const priceMin = Math.min(...lows);
  const priceMax = Math.max(...highs);
  const binSize = (priceMax - priceMin) / bins;
  const profile: Record<number, number> = {};
  for (const c of candles) {
    const mid = (c.high + c.low) / 2;
    let idx = Math.floor((mid - priceMin) / binSize);
    idx = Math.max(0, Math.min(bins - 1, idx));
    const binPrice = priceMin + idx * binSize + binSize / 2;
    profile[binPrice] = (profile[binPrice] || 0) + c.volume;
  }
  const entries = Object.entries(profile).map(([p, v]) => ({ price: +p, volume: v }));
  if (!entries.length) return { poc: null, vah: null, val: null };
  const poc = entries.reduce((a, b) => (a.volume > b.volume ? a : b)).price;
  entries.sort((a, b) => b.volume - a.volume);
  const total = entries.reduce((s, e) => s + e.volume, 0);
  let cum = 0;
  const va: number[] = [];
  for (const e of entries) {
    cum += e.volume;
    va.push(e.price);
    if (cum / total >= 0.7) break;
  }
  return { poc, vah: Math.max(...va), val: Math.min(...va) };
}

export function detectVwapVolumeSignal(
  candles: Candle[],
  opts: { volMult?: number } = {}
): Signal {
  const { volMult = 1.5 } = opts;
  if (candles.length < 50) return makeSignal({ reason: "Insufficient data" });

  const vwapV = vwap(candles);
  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const i = candles.length - 1;
  const atrV = atr(candles, 14);
  const volumes = candles.map((c) => c.volume);
  const avgVol = sma(volumes, 20)[i];
  const volSpike = current.volume > avgVol * volMult;

  const { poc, vah, val } = calcVolumeProfile(candles.slice(-100));

  const crossedUp = current.close > vwapV[i] && prev.close <= vwapV[i - 1];
  const crossedDn = current.close < vwapV[i] && prev.close >= vwapV[i - 1];

  if (crossedUp && volSpike) {
    const entry = current.close;
    const stopLoss = entry - 1.5 * atrV[i];
    const risk = entry - stopLoss;
    const tp1 = vah && vah > entry ? vah : entry + risk * 1.5;
    return makeSignal({
      signal: "long", entry, stop_loss: stopLoss,
      take_profit: [tp1, entry + risk * 2.5, entry + risk * 4],
      confidence: 0.72, reason: "VWAP breakout up + volume",
      timestamp: current.timestamp, metadata: { vwap: vwapV[i], poc, vah, val },
    });
  }
  if (crossedDn && volSpike) {
    const entry = current.close;
    const stopLoss = entry + 1.5 * atrV[i];
    const risk = stopLoss - entry;
    const tp1 = val && val < entry ? val : entry - risk * 1.5;
    return makeSignal({
      signal: "short", entry, stop_loss: stopLoss,
      take_profit: [tp1, entry - risk * 2.5, entry - risk * 4],
      confidence: 0.72, reason: "VWAP breakdown + volume",
      timestamp: current.timestamp, metadata: { vwap: vwapV[i], poc, vah, val },
    });
  }
  return makeSignal({ reason: "No VWAP cross with volume" });
}
