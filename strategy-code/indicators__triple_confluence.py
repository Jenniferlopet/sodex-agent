"""
Triple Confluence Strategy
==========================
EMA + RSI + MACD triple confirmation.

LONG conditions (all required):
  - Fiyat EMA50 > EMA200 (uptrend)
  - RSI 14 > 50 (momentum up) and < 70 (not overbought)
  - MACD histogram > 0 ve MACD line > signal line

SHORT: tersleri.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, ema, rsi, macd, atr


def detect_triple_confluence_signal(
    df: pd.DataFrame,
    ema_fast: int = 50,
    ema_slow: int = 200,
    rsi_period: int = 14,
) -> dict:
    if len(df) < ema_slow + 5:
        return make_signal(reason="Insufficient data")

    ema_f = ema(df["close"], ema_fast)
    ema_s = ema(df["close"], ema_slow)
    rsi_v = rsi(df["close"], rsi_period)
    macd_l, sig_l, hist = macd(df["close"])
    atr_v = atr(df, 14)

    current = df.iloc[-1]
    current_atr = atr_v.iloc[-1]

    long_cond = (
        ema_f.iloc[-1] > ema_s.iloc[-1] and
        current["close"] > ema_f.iloc[-1] and
        50 < rsi_v.iloc[-1] < 70 and
        hist.iloc[-1] > 0 and
        macd_l.iloc[-1] > sig_l.iloc[-1] and
        hist.iloc[-1] > hist.iloc[-2]  # histogram rising
    )

    short_cond = (
        ema_f.iloc[-1] < ema_s.iloc[-1] and
        current["close"] < ema_f.iloc[-1] and
        30 < rsi_v.iloc[-1] < 50 and
        hist.iloc[-1] < 0 and
        macd_l.iloc[-1] < sig_l.iloc[-1] and
        hist.iloc[-1] < hist.iloc[-2]
    )

    if long_cond:
        entry = current["close"]
        stop_loss = entry - 2 * current_atr
        risk = entry - stop_loss
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4],
            confidence=0.8,
            reason="Triple confluence LONG (EMA+RSI+MACD)",
            metadata={"rsi": float(rsi_v.iloc[-1]), "macd_hist": float(hist.iloc[-1])},
        )

    if short_cond:
        entry = current["close"]
        stop_loss = entry + 2 * current_atr
        risk = stop_loss - entry
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4],
            confidence=0.8,
            reason="Triple confluence SHORT (EMA+RSI+MACD)",
            metadata={"rsi": float(rsi_v.iloc[-1]), "macd_hist": float(hist.iloc[-1])},
        )

    return make_signal(reason="No confluence")
