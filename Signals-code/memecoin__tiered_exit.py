"""
Strategy Lab - Tiered Take Profit Exit (Memecoin)

STRATEJI:
- Tiered profit-taking system suited to the fast pump-dump profile of memecoins.
- Bir ENTRY stratejisi degil, POZISYON YONETIMI / EXIT katmanidir.
- +50%  -> %30 sat (anaparayi kurtar)
- +150% -> %30 sat
- +300% -> %30 sat
- Kalan %10 -> moonbag, trailing stop ile takip
- Trailing: ATH'den %35 dusus = full exit
- Hard SL: giris fiyatindan %25 dusus = full exit

INPUT (off-chain pozisyon durumu):
{
    "symbol": "TOKEN",
    "entry_price": float,
    "current_price": float,
    "position_pct_remaining": float,   # kalan pozisyon yuzdesi (0-100)
    "tier1_hit": bool,                  # +50% tetiklendi mi
    "tier2_hit": bool,                  # +150% tetiklendi mi
    "tier3_hit": bool,                  # +300% tetiklendi mi
    "ath_price": float,                 # pozisyon suresince gorulen ATH
}
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from common import make_signal


def check_signal(data: dict, cfg: dict = None) -> dict:
    cfg = cfg or {}
    tp1_mult = cfg.get("tp1_mult", 1.5)    # +50%
    tp2_mult = cfg.get("tp2_mult", 2.5)    # +150%
    tp3_mult = cfg.get("tp3_mult", 4.0)    # +300%
    sell1    = cfg.get("sell1_pct", 30.0)
    sell2    = cfg.get("sell2_pct", 30.0)
    sell3    = cfg.get("sell3_pct", 30.0)
    hard_sl  = cfg.get("hard_sl_pct", 25.0)
    trail_dd = cfg.get("trailing_dd_pct", 35.0)

    symbol  = data.get("symbol", "?")
    entry   = float(data.get("entry_price", 0))
    price   = float(data.get("current_price", 0))
    remain  = float(data.get("position_pct_remaining", 100.0))
    t1      = bool(data.get("tier1_hit", False))
    t2      = bool(data.get("tier2_hit", False))
    t3      = bool(data.get("tier3_hit", False))
    ath     = max(float(data.get("ath_price", entry)), price)

    if entry <= 0 or price <= 0:
        return make_signal("neutral", price, 0, [], 0, "Invalid entry/price")
    if remain <= 0:
        return make_signal("neutral", price, 0, [], 0, "Position already closed")

    pct_change = ((price - entry) / entry) * 100

    # Hard stop loss
    if pct_change <= -hard_sl:
        return make_signal(
            "short", price, 0, [], 1.0,
            f"HARD SL: {pct_change:.1f}% (full exit)",
            metadata={"symbol": symbol, "action": "full_exit", "sell_pct": remain},
        )

    # Trailing stop (sadece kar bolgesinde aktif)
    if pct_change > 30:
        dd_from_ath = ((ath - price) / ath) * 100
        if dd_from_ath >= trail_dd:
            return make_signal(
                "short", price, 0, [], 0.95,
                f"TRAILING STOP: {dd_from_ath:.1f}% drawdown from ATH (full exit)",
                metadata={"symbol": symbol, "action": "full_exit", "sell_pct": remain},
            )

    # Kademeli TP'ler
    if not t3 and price >= entry * tp3_mult:
        return make_signal(
            "short", price, 0, [], 0.9,
            f"TP3 +300%: sell {sell3}%",
            metadata={"symbol": symbol, "action": "partial_sell", "tier": 3, "sell_pct": sell3},
        )
    if not t2 and price >= entry * tp2_mult:
        return make_signal(
            "short", price, 0, [], 0.9,
            f"TP2 +150%: sell {sell2}%",
            metadata={"symbol": symbol, "action": "partial_sell", "tier": 2, "sell_pct": sell2},
        )
    if not t1 and price >= entry * tp1_mult:
        return make_signal(
            "short", price, 0, [], 0.9,
            f"TP1 +50%: sell {sell1}% (kurtar anapara)",
            metadata={"symbol": symbol, "action": "partial_sell", "tier": 1, "sell_pct": sell1},
        )

    return make_signal(
        "neutral", price, 0, [], 0,
        f"HOLD: {pct_change:+.1f}% (no tier hit)",
        metadata={"symbol": symbol, "action": "hold", "ath_price": ath, "pct_change": pct_change},
    )
