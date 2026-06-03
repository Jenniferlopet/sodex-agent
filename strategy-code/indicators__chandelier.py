"""
Chandelier Exit Strategy
========================
ATR-based trailing stop system.

Long stop = highest(high, N) - ATR(N) * multiplier
Short stop = lowest(low, N) + ATR(N) * multiplier

Long entry: if price breaks above the short stop.
Short entry: if price breaks below the long stop.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr, ema


def detect_chandelier_signal(
    df: pd.DataFrame,
    period: int = 22,
    multiplier: float = 3.0,
    use_trend_filter: bool = True,
    ema_period: int = 200,
) -> dict:
    if len(df) < max(period, ema_period) + 5:
        return make_signal(reason="Insufficient data")

    atr_v = atr(df, period)
    long_stop = df["high"].rolling(period).max() - atr_v * multiplier
    short_stop = df["low"].rolling(period).min() + atr_v * multiplier
    trend_ema = ema(df["close"], ema_period)

    current = df.iloc[-1]
    prev = df.iloc[-2]
    current_atr = atr_v.iloc[-1]

    # Long entry: price rose above short_stop
    long_breakout = current["close"] > short_stop.iloc[-1] and prev["close"] <= short_stop.iloc[-2]
    short_breakout = current["close"] < long_stop.iloc[-1] and prev["close"] >= long_stop.iloc[-2]

    if long_breakout:
        if use_trend_filter and current["close"] < trend_ema.iloc[-1]:
            return make_signal(reason="Chandelier long but downtrend")
        entry = current["close"]
        stop_loss = long_stop.iloc[-1]
        risk = entry - stop_loss
        if risk <= 0:
            return make_signal(reason="Invalid risk")
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
            confidence=0.7,
            reason="Chandelier long breakout",
            metadata={"long_stop": float(stop_loss)},
        )

    if short_breakout:
        if use_trend_filter and current["close"] > trend_ema.iloc[-1]:
            return make_signal(reason="Chandelier short but uptrend")
        entry = current["close"]
        stop_loss = short_stop.iloc[-1]
        risk = stop_loss - entry
        if risk <= 0:
            return make_signal(reason="Invalid risk")
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
            confidence=0.7,
            reason="Chandelier short breakout",
            metadata={"short_stop": float(stop_loss)},
        )

    return make_signal(reason="No chandelier breakout")
