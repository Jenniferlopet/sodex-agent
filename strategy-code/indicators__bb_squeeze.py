"""
Bollinger Squeeze Breakout
==========================
When BB bands narrow (squeeze) volatility is low, then an expansion follows.
Price breaking outside the bands after a squeeze = entry.

Squeeze: BB width at its lowest level over the last N candles.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, bollinger_bands, atr, ema


def detect_bb_squeeze_signal(
    df: pd.DataFrame,
    bb_period: int = 20,
    bb_std: float = 2.0,
    squeeze_lookback: int = 50,
    use_volume_filter: bool = True,
) -> dict:
    if len(df) < bb_period + squeeze_lookback:
        return make_signal(reason="Insufficient data")

    upper, middle, lower = bollinger_bands(df["close"], bb_period, bb_std)
    width = (upper - lower) / middle
    current_atr = atr(df, 14).iloc[-1]
    current = df.iloc[-1]
    prev = df.iloc[-2]

    # Squeeze: width in lowest 20% over last N candles
    width_recent = width.iloc[-squeeze_lookback:]
    width_pct = (width.iloc[-1] - width_recent.min()) / (width_recent.max() - width_recent.min() + 1e-10)

    was_in_squeeze = width.iloc[-5:-1].mean() < width_recent.quantile(0.25)

    # Volume check
    avg_vol = df["volume"].rolling(20).mean().iloc[-1]
    vol_ok = (not use_volume_filter) or (current["volume"] > avg_vol * 1.2)

    # Bullish breakout
    if was_in_squeeze and current["close"] > upper.iloc[-1] and prev["close"] <= upper.iloc[-2] and vol_ok:
        entry = current["close"]
        stop_loss = middle.iloc[-1]
        risk = entry - stop_loss
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
            confidence=0.75,
            reason="BB squeeze breakout UP",
            metadata={"width": float(width.iloc[-1])},
        )

    if was_in_squeeze and current["close"] < lower.iloc[-1] and prev["close"] >= lower.iloc[-2] and vol_ok:
        entry = current["close"]
        stop_loss = middle.iloc[-1]
        risk = stop_loss - entry
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
            confidence=0.75,
            reason="BB squeeze breakout DOWN",
            metadata={"width": float(width.iloc[-1])},
        )

    return make_signal(reason="No squeeze breakout")
