"""
Strategy Lab - Holder Distribution Health

STRATEJI:
- Holder growth velocity (hourly increase)
- Gini-coefficient-like distribution score
- Whale concentration takibi
- Healthy distribution = long, declining holders = short

INPUT:
{
    "symbol": str, "price_usd": float,
    "holders_now": int,
    "holders_1h_ago": int,
    "holders_6h_ago": int,
    "whale_count": int,             # >%1 supply tutan
    "median_hold_usd": float,
    "top5_concentration_pct": float,
}
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from common import make_signal


def check_signal(data: dict, cfg: dict = None) -> dict:
    cfg = cfg or {}
    min_holders     = cfg.get("min_holders", 100)
    min_growth_1h   = cfg.get("min_growth_1h_pct", 5)
    max_whale_pct   = cfg.get("max_top5_pct", 35)
    max_whales      = cfg.get("max_whale_count", 30)

    symbol = data.get("symbol", "?")
    price  = float(data.get("price_usd", 0))
    h_now  = int(data.get("holders_now", 0))
    h_1h   = int(data.get("holders_1h_ago", h_now))
    h_6h   = int(data.get("holders_6h_ago", h_now))
    whales = int(data.get("whale_count", 0))
    median = float(data.get("median_hold_usd", 0))
    top5   = float(data.get("top5_concentration_pct", 0))

    if h_now < min_holders:
        return make_signal("neutral", price, 0, [], 0, f"Holders too low ({h_now})")

    growth_1h = ((h_now - h_1h) / max(h_1h, 1)) * 100
    growth_6h = ((h_now - h_6h) / max(h_6h, 1)) * 100

    if growth_1h < -5:
        return make_signal("short", price, price*1.1, [price*0.85, price*0.7, price*0.55], 0.7,
                           f"Holders declining ({growth_1h:.1f}%/h)")

    if growth_1h < min_growth_1h:
        return make_signal("neutral", price, 0, [], 0, f"Weak holder growth ({growth_1h:.1f}%/h)")
    if top5 > max_whale_pct:
        return make_signal("neutral", price, 0, [], 0, f"Whale concentration ({top5:.1f}%)")
    if whales > max_whales:
        return make_signal("neutral", price, 0, [], 0, f"Too many whales ({whales})")

    conf = 0.5
    if growth_1h > 15: conf += 0.15
    if growth_6h > 50: conf += 0.15
    if top5 < 20:      conf += 0.1
    if median > 50:    conf += 0.05  # ortalama daha ciddi para tutuyor
    conf = min(conf, 0.95)

    return make_signal(
        "long", price,
        price * 0.7,
        [price*1.5, price*2.5, price*4.0],
        conf,
        f"Holders +{growth_1h:.1f}%/h, +{growth_6h:.1f}%/6h, top5={top5:.1f}%",
        metadata={"symbol": symbol, "holders": h_now},
    )
