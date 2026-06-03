"""
VWAP + Volume Profile Strategy
==============================
Above VWAP = premium, below = discount.
Volume Profile POC (Point of Control) = the highest-volume level.

LONG: break from below VWAP to above + volume increase.
SHORT: cross from above VWAP to below.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, vwap, atr


def calc_volume_profile(df: pd.DataFrame, bins: int = 30):
    """Volume profile: volume distribution across price bins."""
    price_min = df["low"].min()
    price_max = df["high"].max()
    bin_size = (price_max - price_min) / bins
    profile = {}
    for _, row in df.iterrows():
        mid_price = (row["high"] + row["low"]) / 2
        bin_idx = int((mid_price - price_min) / bin_size)
        bin_idx = max(0, min(bins - 1, bin_idx))
        bin_price = price_min + bin_idx * bin_size + bin_size / 2
        profile[bin_price] = profile.get(bin_price, 0) + row["volume"]
    if not profile:
        return None, None, None
    poc = max(profile, key=profile.get)
    sorted_levels = sorted(profile.items(), key=lambda x: -x[1])
    # Value area (top 70% volume)
    total_vol = sum(profile.values())
    cum = 0
    va_levels = []
    for level, vol in sorted_levels:
        cum += vol
        va_levels.append(level)
        if cum / total_vol >= 0.7:
            break
    vah = max(va_levels)
    val = min(va_levels)
    return poc, vah, val


def detect_vwap_volume_signal(df: pd.DataFrame, vol_mult: float = 1.5) -> dict:
    if len(df) < 50:
        return make_signal(reason="Insufficient data")

    vwap_v = vwap(df)
    current = df.iloc[-1]
    prev = df.iloc[-2]
    current_atr = atr(df, 14).iloc[-1]
    avg_vol = df["volume"].rolling(20).mean().iloc[-1]
    vol_spike = current["volume"] > avg_vol * vol_mult

    # Volume profile (son 100 mum)
    recent_df = df.tail(100)
    poc, vah, val = calc_volume_profile(recent_df)

    # VWAP cross + volume
    crossed_up = current["close"] > vwap_v.iloc[-1] and prev["close"] <= vwap_v.iloc[-2]
    crossed_dn = current["close"] < vwap_v.iloc[-1] and prev["close"] >= vwap_v.iloc[-2]

    if crossed_up and vol_spike:
        entry = current["close"]
        stop_loss = current["close"] - 1.5 * current_atr
        risk = entry - stop_loss
        tp1 = vah if vah and vah > entry else entry + risk * 1.5
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[tp1, entry + risk * 2.5, entry + risk * 4],
            confidence=0.72,
            reason="VWAP breakout up + volume spike",
            metadata={"vwap": float(vwap_v.iloc[-1]), "poc": poc, "vah": vah, "val": val},
        )

    if crossed_dn and vol_spike:
        entry = current["close"]
        stop_loss = current["close"] + 1.5 * current_atr
        risk = stop_loss - entry
        tp1 = val if val and val < entry else entry - risk * 1.5
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[tp1, entry - risk * 2.5, entry - risk * 4],
            confidence=0.72,
            reason="VWAP breakdown + volume spike",
            metadata={"vwap": float(vwap_v.iloc[-1]), "poc": poc, "vah": vah, "val": val},
        )

    return make_signal(reason="No VWAP cross with volume")
