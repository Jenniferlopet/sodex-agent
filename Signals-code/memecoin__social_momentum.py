"""
Strategy Lab - Social Mention Velocity

STRATEJI:
- Acceleration of Twitter/Telegram/Farcaster mention count
- Mention velocity (hourly increase %)
- Sentiment score
- Influencer mentions (KOL takip)
- "Trending" detection - early entry

INPUT:
{
    "symbol": str, "price_usd": float,
    "mentions_now": int,
    "mentions_1h_ago": int,
    "mentions_6h_ago": int,
    "sentiment_score": -1.0 to 1.0,
    "kol_mentions": int,             # influencer mentions in last 1h
    "unique_authors_1h": int,
}
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from common import make_signal


def check_signal(data: dict, cfg: dict = None) -> dict:
    cfg = cfg or {}
    min_mentions    = cfg.get("min_mentions_now", 20)
    min_velocity    = cfg.get("min_velocity_pct", 50)
    min_sentiment   = cfg.get("min_sentiment", 0.2)
    min_authors     = cfg.get("min_unique_authors", 10)

    symbol = data.get("symbol", "?")
    price  = float(data.get("price_usd", 0))
    m_now  = int(data.get("mentions_now", 0))
    m_1h   = int(data.get("mentions_1h_ago", m_now))
    m_6h   = int(data.get("mentions_6h_ago", m_now))
    sent   = float(data.get("sentiment_score", 0))
    kol    = int(data.get("kol_mentions", 0))
    authors= int(data.get("unique_authors_1h", 0))

    if m_now < min_mentions:
        return make_signal("neutral", price, 0, [], 0, f"Low mentions ({m_now})")

    velocity = ((m_now - m_1h) / max(m_1h, 1)) * 100
    if velocity < min_velocity:
        return make_signal("neutral", price, 0, [], 0, f"Weak velocity ({velocity:.0f}%/h)")
    if sent < min_sentiment:
        return make_signal("neutral", price, 0, [], 0, f"Weak sentiment ({sent:.2f})")
    if authors < min_authors:
        return make_signal("neutral", price, 0, [], 0, f"Few unique authors ({authors})")

    conf = 0.5
    if velocity > 200:  conf += 0.15
    if sent > 0.6:      conf += 0.1
    if kol >= 1:        conf += 0.15
    if authors > 50:    conf += 0.1
    conf = min(conf, 0.95)

    return make_signal(
        "long", price,
        price * 0.7,
        [price*1.5, price*2.5, price*4.0],
        conf,
        f"Social: mentions {m_now} (+{velocity:.0f}%/h), sent={sent:.2f}, KOL={kol}",
        metadata={"symbol": symbol, "velocity_pct": velocity},
    )
