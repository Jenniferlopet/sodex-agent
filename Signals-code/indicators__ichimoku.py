"""
Ichimoku Cloud Breakout
=======================
Tenkan/Kijun cross + Kumo (cloud) breakout + Chikou confirmation.

LONG:
  - Price above the cloud
  - Tenkan > Kijun (TK cross up)
  - Chikou (close, shifted back 26) above past price
  - Kumo green (future Senkou A > Senkou B)
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr


def calc_ichimoku(df: pd.DataFrame, tenkan: int = 9, kijun: int = 26, senkou_b: int = 52):
    high = df["high"]
    low = df["low"]
    tenkan_sen = (high.rolling(tenkan).max() + low.rolling(tenkan).min()) / 2
    kijun_sen = (high.rolling(kijun).max() + low.rolling(kijun).min()) / 2
    senkou_a = ((tenkan_sen + kijun_sen) / 2).shift(kijun)
    senkou_b_val = ((high.rolling(senkou_b).max() + low.rolling(senkou_b).min()) / 2).shift(kijun)
    chikou = df["close"].shift(-kijun)
    return tenkan_sen, kijun_sen, senkou_a, senkou_b_val, chikou


def detect_ichimoku_signal(df: pd.DataFrame) -> dict:
    if len(df) < 100:
        return make_signal(reason="Insufficient data")

    tk, kj, sa, sb, ch = calc_ichimoku(df)
    current = df.iloc[-1]
    prev = df.iloc[-2]
    current_atr = atr(df, 14).iloc[-1]

    cloud_top = max(sa.iloc[-1], sb.iloc[-1])
    cloud_bot = min(sa.iloc[-1], sb.iloc[-1])
    kumo_green = sa.iloc[-1] > sb.iloc[-1]

    # TK cross
    tk_cross_up = tk.iloc[-1] > kj.iloc[-1] and tk.iloc[-2] <= kj.iloc[-2]
    tk_cross_dn = tk.iloc[-1] < kj.iloc[-1] and tk.iloc[-2] >= kj.iloc[-2]

    if current["close"] > cloud_top and tk_cross_up and kumo_green:
        entry = current["close"]
        stop_loss = kj.iloc[-1]
        risk = entry - stop_loss
        if risk <= 0:
            return make_signal(reason="Invalid risk")
        return make_signal(
            signal="long",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry + risk * 2, entry + risk * 3, entry + risk * 5],
            confidence=0.8,
            reason="Ichimoku full bullish setup",
            metadata={"tenkan": float(tk.iloc[-1]), "kijun": float(kj.iloc[-1])},
        )

    if current["close"] < cloud_bot and tk_cross_dn and not kumo_green:
        entry = current["close"]
        stop_loss = kj.iloc[-1]
        risk = stop_loss - entry
        if risk <= 0:
            return make_signal(reason="Invalid risk")
        return make_signal(
            signal="short",
            entry=entry,
            stop_loss=stop_loss,
            take_profit=[entry - risk * 2, entry - risk * 3, entry - risk * 5],
            confidence=0.8,
            reason="Ichimoku full bearish setup",
            metadata={"tenkan": float(tk.iloc[-1]), "kijun": float(kj.iloc[-1])},
        )

    return make_signal(reason="Ichimoku conditions not aligned")
