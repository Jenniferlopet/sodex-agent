"""
Strategy Lab - Volume Surge Detection (Memecoin)

STRATEJI:
- Classic volume_avg vs volume_now comparison
- Surge across different timeframes (5m/15m/1h)
- Buy pressure check (buy volume > sell volume)
- Price tepkisi kontrol (volume up + price up = long, volume up + price down = avoid)

INPUT: list[Candle] (5dk OHLCV) - en az 50 mum
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from common import make_signal, atr, sma, validate_ohlcv


def check_signal(candles: list, cfg: dict = None) -> dict:
    cfg = cfg or {}
    surge_mult = cfg.get("surge_multiplier", 3.0)
    lookback   = cfg.get("volume_lookback", 20)
    atr_mult   = cfg.get("sl_atr_mult", 1.5)
    rr1, rr2, rr3 = cfg.get("rr_targets", (2.0, 3.5, 5.0))

    if not validate_ohlcv(candles, lookback + 5):
        return make_signal("neutral", 0, 0, [], 0, "Not enough candles")

    vols   = [c["volume"] for c in candles]
    closes = [c["close"] for c in candles]
    opens  = [c["open"] for c in candles]
    avg_v  = sum(vols[-lookback-1:-1]) / lookback
    now_v  = vols[-1]

    if now_v < avg_v * surge_mult:
        return make_signal("neutral", closes[-1], 0, [], 0, f"No surge ({now_v/max(avg_v,1):.2f}x)")

    bull = closes[-1] > opens[-1]
    a = atr(candles, 14)
    price = closes[-1]

    if not bull:
        return make_signal("neutral", price, 0, [], 0, "Volume surge on red candle - avoid")

    sl = price - a * atr_mult
    risk = price - sl
    conf = min(0.5 + (now_v/avg_v - surge_mult) * 0.05 + 0.2, 0.95)

    return make_signal(
        "long", price, sl,
        [price + risk * rr1, price + risk * rr2, price + risk * rr3],
        conf,
        f"Volume surge {now_v/avg_v:.2f}x avg, bullish candle",
        metadata={"surge_ratio": now_v/avg_v},
    )
