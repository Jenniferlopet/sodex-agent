"""
Strategy Lab - Dev Wallet & First Buyers Pattern

STRATEJI:
- Analysis of dev wallet hold %, sniper wallets, and bundled wallets
- Dev hold > %15 = rug riski (KIRMIZI)
- Top 10 holder concentration > %40 = manipulation riski
- Short signal if dev selling is detected
- Clean distribution + no insider dumps = long signal

INPUT:
{
    "symbol": str, "price_usd": float,
    "dev_hold_pct": float,
    "dev_sold_pct": float,        # what percent of original supply the dev sold
    "top10_concentration_pct": float,
    "bundled_wallets_pct": float, # percentage of snipe bot wallets
    "insider_wallets_count": int,
    "is_mint_authority_renounced": bool,
    "is_freeze_authority_renounced": bool,
}
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from common import make_signal


def check_signal(data: dict, cfg: dict = None) -> dict:
    cfg = cfg or {}
    max_dev_hold     = cfg.get("max_dev_hold_pct", 15)
    max_top10        = cfg.get("max_top10_pct", 40)
    max_bundled      = cfg.get("max_bundled_pct", 30)
    dev_dump_thresh  = cfg.get("dev_dump_pct", 30)

    symbol = data.get("symbol", "?")
    price  = float(data.get("price_usd", 0))
    devH   = float(data.get("dev_hold_pct", 0))
    devS   = float(data.get("dev_sold_pct", 0))
    top10  = float(data.get("top10_concentration_pct", 0))
    bundled= float(data.get("bundled_wallets_pct", 0))
    insiders = int(data.get("insider_wallets_count", 0))
    mintR  = bool(data.get("is_mint_authority_renounced", False))
    freezeR= bool(data.get("is_freeze_authority_renounced", False))

    if devS >= dev_dump_thresh:
        return make_signal("short", price, price * 1.10, [price*0.85, price*0.65, price*0.40], 0.85,
                           f"DEV DUMP detected ({devS:.1f}% sold)")

    if not mintR or not freezeR:
        return make_signal("neutral", price, 0, [], 0,
                           f"Authority not renounced (mint={mintR}, freeze={freezeR})")

    if devH > max_dev_hold:
        return make_signal("neutral", price, 0, [], 0, f"Dev hold too high ({devH:.1f}%)")
    if top10 > max_top10:
        return make_signal("neutral", price, 0, [], 0, f"Top10 concentration too high ({top10:.1f}%)")
    if bundled > max_bundled:
        return make_signal("neutral", price, 0, [], 0, f"Too many bundled wallets ({bundled:.1f}%)")

    conf = 0.5
    if devH < 5:      conf += 0.15
    if top10 < 25:    conf += 0.1
    if bundled < 15:  conf += 0.1
    if insiders == 0: conf += 0.1
    conf = min(conf, 0.95)

    return make_signal(
        "long", price,
        price * 0.65,
        [price * 1.5, price * 2.5, price * 4.0],
        conf,
        f"Clean distribution: dev={devH:.1f}% top10={top10:.1f}% bundled={bundled:.1f}%",
        metadata={"symbol": symbol},
    )
