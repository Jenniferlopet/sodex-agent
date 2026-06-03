"""
Wyckoff Phase Detection Strategy
=================================
Detects Wyckoff accumulation/distribution phases.

Accumulation (taban):
  Phase A: Selling climax (SC) + automatic rally (AR)
  Phase B: Sideways trading, building cause
  Phase C: Spring (false breakdown of support)
  Phase D: Rally, sign of strength (SOS)
  Phase E: Markup phase begins -> LONG entry

Distribution (tepe): ters.

Simplified version: Spring/Upthrust + volume divergence.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr, sma


def detect_wyckoff_signal(
    df: pd.DataFrame,
    range_lookback: int = 30,
    vol_lookback: int = 50,
) -> dict:
    if len(df) < range_lookback + vol_lookback:
        return make_signal(reason="Insufficient data")

    current = df.iloc[-1]
    current_atr = atr(df, 14).iloc[-1]
    range_df = df.iloc[-range_lookback - 5:-1]
    range_high = range_df["high"].max()
    range_low = range_df["low"].min()
    range_size = range_high - range_low

    avg_vol = df["volume"].rolling(vol_lookback).mean().iloc[-1]
    high_vol = current["volume"] > avg_vol * 1.5

    # Range tight enough? (consolidation)
    range_atr_ratio = range_size / current_atr
    is_consolidating = range_atr_ratio < 8  # 8 ATR'lik range max

    if not is_consolidating:
        return make_signal(reason="No consolidation - trending market")

    # Spring: wick below range low, fast reversal, high volume
    spring = (
        current["low"] < range_low and
        current["close"] > range_low and
        current["close"] > current["open"] and
        high_vol
    )

    # Upthrust: wick above range high, fast reversal, high volume
    upthrust = (
        current["high"] > range_high and
        current["close"] < range_high and
        current["close"] < current["open"] and
        high_vol
    )

    if spring:
        entry = current["close"]
        stop_loss = current["low"] - 0.5 * current_atr
        risk = entry - stop_loss
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[range_high, range_high + range_size * 0.5, range_high + range_size * 1.0],
            confidence=0.82,
            reason="Wyckoff Spring (Phase C accumulation)",
            metadata={"range_high": range_high, "range_low": range_low},
        )

    if upthrust:
        entry = current["close"]
        stop_loss = current["high"] + 0.5 * current_atr
        risk = stop_loss - entry
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[range_low, range_low - range_size * 0.5, range_low - range_size * 1.0],
            confidence=0.82,
            reason="Wyckoff Upthrust (Phase C distribution)",
            metadata={"range_high": range_high, "range_low": range_low},
        )

    return make_signal(reason="No spring/upthrust")
