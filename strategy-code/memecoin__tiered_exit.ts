// Strategy Lab - Tiered Take Profit Exit
import { makeSignal, Signal } from "../../common";

export interface TieredExitData {
  symbol: string;
  entry_price: number;
  current_price: number;
  position_pct_remaining: number;
  tier1_hit: boolean;
  tier2_hit: boolean;
  tier3_hit: boolean;
}

export interface TieredExitConfig {
  tier1_gain_pct?: number;
  tier2_gain_pct?: number;
  tier3_gain_pct?: number;
  initial_sl_pct?: number;
  breakeven_trigger_pct?: number;
}

export function checkSignal(data: TieredExitData, cfg: TieredExitConfig = {}): Signal {
  const t1p = cfg.tier1_gain_pct ?? 50;
  const t2p = cfg.tier2_gain_pct ?? 150;
  const t3p = cfg.tier3_gain_pct ?? 300;
  const slP = cfg.initial_sl_pct ?? 30;
  const beT = cfg.breakeven_trigger_pct ?? 50;

  const { symbol, entry_price: entry, current_price: price,
          position_pct_remaining: rem,
          tier1_hit: t1, tier2_hit: t2, tier3_hit: t3 } = data;

  if (entry === 0 || rem <= 0)
    return makeSignal("neutral", price, 0, [], 0, "No position");

  const gain = ((price - entry) / entry) * 100;
  let sl = entry * (1 - slP/100);
  if (gain >= beT) sl = entry;

  if (gain <= -slP)
    return makeSignal("short", price, 0, [], 1.0,
                      `STOP LOSS (${gain.toFixed(1)}%)`,
                      { action: "exit_full", symbol });

  if (gain >= t3p && !t3 && rem > 0)
    return makeSignal("short", price, 0, [], 0.95,
                      `TP3 hit (${gain.toFixed(1)}%) - exit remaining`,
                      { action: "exit_remaining", tier: 3, symbol });
  if (gain >= t2p && !t2)
    return makeSignal("short", price, 0, [], 0.9,
                      `TP2 hit (${gain.toFixed(1)}%) - exit 33%`,
                      { action: "exit_33", tier: 2, symbol });
  if (gain >= t1p && !t1)
    return makeSignal("short", price, 0, [], 0.85,
                      `TP1 hit (${gain.toFixed(1)}%) - exit 33%`,
                      { action: "exit_33", tier: 1, symbol });

  return makeSignal("neutral", price, sl,
                    [entry*(1+t1p/100), entry*(1+t2p/100), entry*(1+t3p/100)],
                    0.5,
                    `Holding ${(rem*100).toFixed(0)}%, P&L ${gain.toFixed(1)}%`,
                    { symbol, gain_pct: gain });
}
