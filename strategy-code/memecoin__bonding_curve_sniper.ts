// Strategy Lab - Bonding Curve Sniper (Pump.fun / BonkFun / Bags.fm)
import { makeSignal, Signal } from "../../common";

export interface BondingCurveData {
  symbol: string;
  bonding_curve_pct: number;
  holders: number;
  buys_5m: number;
  sells_5m: number;
  volume_usd_5m: number;
  price_usd: number;
  age_minutes: number;
}

export interface BCSConfig {
  min_holders?: number;
  min_volume_usd_5m?: number;
  min_buy_ratio?: number;
  min_age_minutes?: number;
  max_age_minutes?: number;
  sweet_zone_low?: number;
  sweet_zone_high?: number;
  exit_curve_pct?: number;
}

export function checkSignal(data: BondingCurveData, cfg: BCSConfig = {}): Signal {
  const minH  = cfg.min_holders ?? 50;
  const minV  = cfg.min_volume_usd_5m ?? 5000;
  const minBR = cfg.min_buy_ratio ?? 1.5;
  const minA  = cfg.min_age_minutes ?? 2;
  const maxA  = cfg.max_age_minutes ?? 240;
  const szL   = cfg.sweet_zone_low ?? 20;
  const szH   = cfg.sweet_zone_high ?? 60;
  const exitP = cfg.exit_curve_pct ?? 90;

  const { symbol, bonding_curve_pct: curve, holders, buys_5m: buys, sells_5m: sells,
          volume_usd_5m: vol, price_usd: price, age_minutes: age } = data;

  if (age < minA) return makeSignal("neutral", price, 0, [], 0, `Too fresh (${age}min)`);
  if (age > maxA) return makeSignal("neutral", price, 0, [], 0, `Too old (${age}min)`);
  if (curve >= exitP)
    return makeSignal("short", price, price*1.15, [price*0.85, price*0.7, price*0.5], 0.7,
                     `Pre-migration exit (${curve.toFixed(1)}%)`);
  if (holders < minH) return makeSignal("neutral", price, 0, [], 0, `Low holders (${holders})`);
  if (vol < minV)     return makeSignal("neutral", price, 0, [], 0, `Low volume ($${vol.toFixed(0)})`);

  const buyRatio = buys / Math.max(sells, 1);
  if (buyRatio < minBR)
    return makeSignal("neutral", price, 0, [], 0, `Weak buy ratio (${buyRatio.toFixed(2)})`);

  const inSweet = curve >= szL && curve <= szH;
  let conf = 0.5;
  if (inSweet)         conf += 0.2;
  if (buyRatio > 2.5)  conf += 0.1;
  if (holders > 200)   conf += 0.1;
  if (vol > 20000)     conf += 0.1;
  conf = Math.min(conf, 0.95);

  return makeSignal("long", price, price*0.7, [price*1.5, price*2.5, price*4.0], conf,
                    `BCS: curve=${curve.toFixed(1)}% holders=${holders} buyR=${buyRatio.toFixed(2)} vol=$${vol.toFixed(0)}`,
                    { symbol, zone: inSweet ? "sweet" : curve < szL ? "early" : "late" });
}
