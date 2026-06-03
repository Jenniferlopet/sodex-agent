"""
Liquidity Grab + Break of Structure
====================================
Stop hunt (sweep the previous swing high/low) + structure break = entry.

Bullish setup:
  1. Price sweeps the previous swing low (wick down)
  2. Candle closes back up
  3. Breaks next structure (passes previous HH) -> BOS
  4. Long entry

Bearish setup: ters.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr, swing_highs_lows


def detect_liquidity_grab_bos_signal(
    df: pd.DataFrame,
    swing_lookback: int = 10,
    grab_atr: float = 0.2,
) -> dict:
    if len(df) < swing_lookback * 3:
        return make_signal(reason="Insufficient data")

    sh, sl = swing_highs_lows(df, swing_lookback)
    current_atr = atr(df, 14).iloc[-1]
    current = df.iloc[-1]
    prev = df.iloc[-2]

    # Son swing high & low
    recent_highs = sh.dropna().tail(5)
    recent_lows = sl.dropna().tail(5)
    if len(recent_highs) < 2 or len(recent_lows) < 2:
        return make_signal(reason="No clear structure")

    last_swing_high = recent_highs.iloc[-1]
    last_swing_low = recent_lows.iloc[-1]
    prev_swing_high = recent_highs.iloc[-2]
    prev_swing_low = recent_lows.iloc[-2]

    # Bullish: previous swing low swept + structure broken up
    grabbed_low = prev["low"] < last_swing_low and prev["close"] > last_swing_low
    bos_up = current["close"] > last_swing_high
    if grabbed_low and bos_up:
        entry = current["close"]
        stop_loss = prev["low"] - 0.3 * current_atr
        risk = entry - stop_loss
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 2, entry + risk * 3, entry + risk * 5],
            confidence=0.82,
            reason="Liquidity grab below swing low + BOS up",
            metadata={"grabbed_level": last_swing_low, "bos_level": last_swing_high},
        )

    # Bearish: previous swing high swept + structure broken down
    grabbed_high = prev["high"] > last_swing_high and prev["close"] < last_swing_high
    bos_dn = current["close"] < last_swing_low
    if grabbed_high and bos_dn:
        entry = current["close"]
        stop_loss = prev["high"] + 0.3 * current_atr
        risk = stop_loss - entry
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 2, entry - risk * 3, entry - risk * 5],
            confidence=0.82,
            reason="Liquidity grab above swing high + BOS down",
            metadata={"grabbed_level": last_swing_high, "bos_level": last_swing_low},
        )

    return make_signal(reason="No liquidity grab + BOS setup")
