"""
Equal Highs/Lows Sweep (EQH/EQL)
=================================
Formation of highs/lows at two or more nearby levels = a liquidity pool.
Sweeping this level (wicked past then reversed) = entry signal.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr, swing_highs_lows


def detect_eq_sweep_signal(
    df: pd.DataFrame,
    tolerance_atr: float = 0.15,
    swing_lb: int = 5,
) -> dict:
    if len(df) < 50:
        return make_signal(reason="Insufficient data")

    sh, sl = swing_highs_lows(df, swing_lb)
    current_atr = atr(df, 14).iloc[-1]
    tolerance = current_atr * tolerance_atr

    # Search EQH/EQL within the last 20 swings
    recent_highs = sh.dropna().tail(10).values
    recent_lows = sl.dropna().tail(10).values

    eqh_level = None
    eql_level = None

    # EQH: 2+ highs close to each other
    for i in range(len(recent_highs) - 1):
        for j in range(i + 1, len(recent_highs)):
            if abs(recent_highs[i] - recent_highs[j]) <= tolerance:
                eqh_level = max(recent_highs[i], recent_highs[j])
                break

    for i in range(len(recent_lows) - 1):
        for j in range(i + 1, len(recent_lows)):
            if abs(recent_lows[i] - recent_lows[j]) <= tolerance:
                eql_level = min(recent_lows[i], recent_lows[j])
                break

    current = df.iloc[-1]
    prev = df.iloc[-2]

    # Bullish sweep: EQL swept and reversal present
    if eql_level is not None and prev["low"] < eql_level and prev["close"] > eql_level \
       and current["close"] > current["open"]:
        entry = current["close"]
        stop_loss = prev["low"] - 0.3 * current_atr
        risk = entry - stop_loss
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 2, entry + risk * 3, entry + risk * 5],
            confidence=0.76,
            reason=f"EQL sweep at {eql_level:.4f}",
            metadata={"eql": eql_level},
        )

    # Bearish sweep: EQH swept
    if eqh_level is not None and prev["high"] > eqh_level and prev["close"] < eqh_level \
       and current["close"] < current["open"]:
        entry = current["close"]
        stop_loss = prev["high"] + 0.3 * current_atr
        risk = stop_loss - entry
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 2, entry - risk * 3, entry - risk * 5],
            confidence=0.76,
            reason=f"EQH sweep at {eqh_level:.4f}",
            metadata={"eqh": eqh_level},
        )

    return make_signal(reason="No EQH/EQL sweep")
