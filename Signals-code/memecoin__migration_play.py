"""
Strategy Lab - Migration Play (Pump.fun -> Raydium / Moonshot -> Meteora)

STRATEJI:
- Prepare position when bonding curve is ~95-100% full
- Catch the initial pump at migration (price spikes when LP is added)
- Fast 50%+ profit in the first 5m is normal
- Tight stop for the first post-migration sell-off

INPUT:
{
    "symbol": str, "price_usd": float,
    "bonding_curve_pct": float,
    "migration_target_pct": float,   # 100 = mig threshold
    "is_migrated": bool,
    "minutes_since_migration": int,
    "post_mig_volume_usd": float,
    "post_mig_buys": int,
    "post_mig_sells": int,
}
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from common import make_signal


def check_signal(data: dict, cfg: dict = None) -> dict:
    cfg = cfg or {}
    pre_mig_zone   = cfg.get("pre_mig_curve_pct", 95)
    post_mig_max_m = cfg.get("post_mig_max_minutes", 30)
    min_post_vol   = cfg.get("min_post_mig_volume", 10000)
    min_buy_ratio  = cfg.get("min_buy_ratio", 1.3)

    symbol = data.get("symbol", "?")
    price  = float(data.get("price_usd", 0))
    curve  = float(data.get("bonding_curve_pct", 0))
    target = float(data.get("migration_target_pct", 100))
    migd   = bool(data.get("is_migrated", False))
    mins   = int(data.get("minutes_since_migration", 0))
    vol    = float(data.get("post_mig_volume_usd", 0))
    buys   = int(data.get("post_mig_buys", 0))
    sells  = int(data.get("post_mig_sells", 1))

    if not migd:
        if curve >= pre_mig_zone:
            return make_signal("long", price, price*0.9,
                               [price*1.3, price*1.7, price*2.2], 0.6,
                               f"Pre-migration setup ({curve:.1f}%/{target:.0f}%)",
                               metadata={"symbol": symbol, "stage": "pre"})
        return make_signal("neutral", price, 0, [], 0, f"Not at mig zone yet ({curve:.1f}%)")

    if mins > post_mig_max_m:
        return make_signal("neutral", price, 0, [], 0, f"Migration too old ({mins}min)")
    if vol < min_post_vol:
        return make_signal("neutral", price, 0, [], 0, f"Weak post-mig volume (${vol:.0f})")

    ratio = buys / max(sells, 1)
    if ratio < min_buy_ratio:
        return make_signal("neutral", price, 0, [], 0, f"Selling pressure post-mig ({ratio:.2f})")

    conf = 0.55
    if mins < 10:        conf += 0.15
    if ratio > 2.0:      conf += 0.1
    if vol > 50000:      conf += 0.15
    conf = min(conf, 0.9)

    return make_signal(
        "long", price,
        price * 0.85,
        [price*1.5, price*2.5, price*4.0],
        conf,
        f"Post-migration pump: {mins}min, ${vol:.0f} vol, buy_ratio={ratio:.2f}",
        metadata={"symbol": symbol, "stage": "post"},
    )
