"""
Supertrend + ADX Strategy
=========================
Supertrend direction + ADX trend-strength filter.

LONG: Supertrend green + ADX > 25.
SHORT: Supertrend red + ADX > 25.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr, adx


def calc_supertrend(df: pd.DataFrame, period: int = 10, multiplier: float = 3.0):
    atr_v = atr(df, period)
    hl2 = (df["high"] + df["low"]) / 2
    upper_band = hl2 + multiplier * atr_v
    lower_band = hl2 - multiplier * atr_v

    supertrend = pd.Series(index=df.index, dtype=float)
    direction = pd.Series(index=df.index, dtype=int)  # 1 = long, -1 = short

    for i in range(len(df)):
        if i == 0:
            supertrend.iloc[i] = upper_band.iloc[i]
            direction.iloc[i] = -1
            continue
        # Final bands
        if df["close"].iloc[i - 1] > supertrend.iloc[i - 1]:
            # was long
            supertrend.iloc[i] = max(lower_band.iloc[i], supertrend.iloc[i - 1])
            if df["close"].iloc[i] < supertrend.iloc[i]:
                supertrend.iloc[i] = upper_band.iloc[i]
                direction.iloc[i] = -1
            else:
                direction.iloc[i] = 1
        else:
            supertrend.iloc[i] = min(upper_band.iloc[i], supertrend.iloc[i - 1])
            if df["close"].iloc[i] > supertrend.iloc[i]:
                supertrend.iloc[i] = lower_band.iloc[i]
                direction.iloc[i] = 1
            else:
                direction.iloc[i] = -1
    return supertrend, direction


def detect_supertrend_adx_signal(
    df: pd.DataFrame,
    st_period: int = 10,
    st_mult: float = 3.0,
    adx_period: int = 14,
    adx_threshold: float = 25,
) -> dict:
    if len(df) < max(st_period, adx_period) * 3:
        return make_signal(reason="Insufficient data")

    st, direction = calc_supertrend(df, st_period, st_mult)
    adx_v = adx(df, adx_period)
    current = df.iloc[-1]
    current_atr = atr(df, 14).iloc[-1]

    # Direction change
    flipped_up = direction.iloc[-1] == 1 and direction.iloc[-2] == -1
    flipped_dn = direction.iloc[-1] == -1 and direction.iloc[-2] == 1

    adx_strong = adx_v.iloc[-1] > adx_threshold

    if flipped_up and adx_strong:
        entry = current["close"]
        stop_loss = st.iloc[-1]
        risk = entry - stop_loss
        if risk <= 0:
            return make_signal(reason="Invalid risk")
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
            confidence=0.78,
            reason=f"Supertrend flip up + ADX {adx_v.iloc[-1]:.1f}",
            metadata={"adx": float(adx_v.iloc[-1])},
        )

    if flipped_dn and adx_strong:
        entry = current["close"]
        stop_loss = st.iloc[-1]
        risk = stop_loss - entry
        if risk <= 0:
            return make_signal(reason="Invalid risk")
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
            confidence=0.78,
            reason=f"Supertrend flip down + ADX {adx_v.iloc[-1]:.1f}",
            metadata={"adx": float(adx_v.iloc[-1])},
        )

    return make_signal(reason="No supertrend flip with strong ADX")
