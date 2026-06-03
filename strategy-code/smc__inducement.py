"""
Inducement & Mitigation Strategy
=================================
Inducement = a fake break on a lower timeframe (to draw liquidity).
Mitigation = the real-direction move begins after the fake break.

Setup:
  1. A swing low/high forms
  2. Fake break (wicks past but fails to close)
  3. Fast reversal = inducement
  4. Previous structure breaks = mitigation confirmation -> entry
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr, swing_highs_lows


def detect_inducement_signal(df: pd.DataFrame, swing_lb: int = 8) -> dict:
    if len(df) < swing_lb * 3:
        return make_signal(reason="Insufficient data")

    sh, sl = swing_highs_lows(df, swing_lb)
    current_atr = atr(df, 14).iloc[-1]
    current = df.iloc[-1]
    last_3 = df.iloc[-4:-1]  # last 3 candles (excluding current)

    recent_lows = sl.dropna().tail(3)
    recent_highs = sh.dropna().tail(3)
    if len(recent_lows) < 2 or len(recent_highs) < 2:
        return make_signal(reason="No structure")

    last_low = recent_lows.iloc[-1]
    last_high = recent_highs.iloc[-1]

    # Bullish inducement: one of last 3 candles wicked below the low but failed to close
    wick_below = ((last_3["low"] < last_low) & (last_3["close"] > last_low)).any()
    rejected = current["close"] > current["open"] and current["close"] > last_3["high"].max()
    if wick_below and rejected:
        entry = current["close"]
        stop_loss = last_3["low"].min() - 0.3 * current_atr
        risk = entry - stop_loss
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 2, entry + risk * 3, entry + risk * 5],
            confidence=0.7,
            reason="Bullish inducement + mitigation",
        )

    wick_above = ((last_3["high"] > last_high) & (last_3["close"] < last_high)).any()
    rejected_dn = current["close"] < current["open"] and current["close"] < last_3["low"].min()
    if wick_above and rejected_dn:
        entry = current["close"]
        stop_loss = last_3["high"].max() + 0.3 * current_atr
        risk = stop_loss - entry
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 2, entry - risk * 3, entry - risk * 5],
            confidence=0.7,
            reason="Bearish inducement + mitigation",
        )

    return make_signal(reason="No inducement setup")
