"""
Strategy Lab - Bonding Curve Sniper (Pump.fun / BonkFun / Bags.fm)

STRATEJI:
- Generate signals based on bonding curve fill % for new token launches
- 0-20%: Risky/early, highest upside
- 20-60%: Sweet spot - momentum proven, still on the curve
- %60-90: Pre-migration zone, dikkatli
- 90%+: Migration imminent, time to exit
- Volume + holder growth + buy/sell ratio filtreler ekleniyor

INPUT (off-chain data):
{
    "symbol": "TOKEN",
    "bonding_curve_pct": 0-100,   # curve doluluk %
    "holders": int,
    "buys_5m": int,
    "sells_5m": int,
    "volume_usd_5m": float,
    "price_usd": float,
    "age_minutes": int,
}
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from common import make_signal


def check_signal(data: dict, cfg: dict = None) -> dict:
    cfg = cfg or {}
    min_holders   = cfg.get("min_holders", 50)
    min_volume    = cfg.get("min_volume_usd_5m", 5000)
    min_buy_ratio = cfg.get("min_buy_ratio", 1.5)
    min_age       = cfg.get("min_age_minutes", 2)
    max_age       = cfg.get("max_age_minutes", 240)
    sweet_low     = cfg.get("sweet_zone_low", 20)
    sweet_high    = cfg.get("sweet_zone_high", 60)
    exit_pct      = cfg.get("exit_curve_pct", 90)

    symbol = data.get("symbol", "?")
    curve  = float(data.get("bonding_curve_pct", 0))
    holders= int(data.get("holders", 0))
    buys   = int(data.get("buys_5m", 0))
    sells  = int(data.get("sells_5m", 1))
    vol    = float(data.get("volume_usd_5m", 0))
    price  = float(data.get("price_usd", 0))
    age    = int(data.get("age_minutes", 0))

    if age < min_age:
        return make_signal("neutral", price, 0, [], 0, f"Too fresh ({age}min)")
    if age > max_age:
        return make_signal("neutral", price, 0, [], 0, f"Too old ({age}min)")
    if curve >= exit_pct:
        return make_signal("short", price, price * 1.15, [price*0.85, price*0.7, price*0.5], 0.7,
                           f"Pre-migration exit zone ({curve:.1f}%)")
    if holders < min_holders:
        return make_signal("neutral", price, 0, [], 0, f"Low holders ({holders})")
    if vol < min_volume:
        return make_signal("neutral", price, 0, [], 0, f"Low volume (${vol:.0f})")

    buy_ratio = buys / max(sells, 1)
    if buy_ratio < min_buy_ratio:
        return make_signal("neutral", price, 0, [], 0, f"Weak buy ratio ({buy_ratio:.2f})")

    in_sweet = sweet_low <= curve <= sweet_high
    conf = 0.5
    if in_sweet:           conf += 0.2
    if buy_ratio > 2.5:    conf += 0.1
    if holders > 200:      conf += 0.1
    if vol > 20000:        conf += 0.1
    conf = min(conf, 0.95)

    return make_signal(
        "long", price,
        price * 0.7,
        [price * 1.5, price * 2.5, price * 4.0],
        conf,
        f"BCS: curve={curve:.1f}% holders={holders} buy_ratio={buy_ratio:.2f} vol=${vol:.0f}",
        metadata={"symbol": symbol, "zone": "sweet" if in_sweet else "early" if curve < sweet_low else "late"},
    )
