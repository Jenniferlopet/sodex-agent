"""
FVG (Fair Value Gap) Strategy
=============================
Detects a liquidity gap across 3 consecutive candles, enters on mitigation.

BULLISH FVG: candle[i-2].high < candle[i].low
BEARISH FVG: candle[i-2].low > candle[i].high

Entry: FVG'nin %50 mitigation seviyesinde
SL: FVG'nin ters ucu + 0.5 ATR
TP: 1:2 ve 1:3 RR
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

import pandas as pd
import numpy as np
from common import make_signal, atr, ema, market_structure


def detect_fvgs(df: pd.DataFrame, min_gap_atr: float = 0.3):
    """Detect all FVGs. Returns a list."""
    atr_series = atr(df, 14)
    fvgs = []
    for i in range(2, len(df)):
        c1_high = df["high"].iloc[i - 2]
        c1_low = df["low"].iloc[i - 2]
        c3_high = df["high"].iloc[i]
        c3_low = df["low"].iloc[i]
        current_atr = atr_series.iloc[i]
        if pd.isna(current_atr):
            continue

        # Bullish FVG
        if c1_high < c3_low:
            gap = c3_low - c1_high
            if gap >= current_atr * min_gap_atr:
                fvgs.append({
                    "index": i,
                    "type": "bullish",
                    "top": c3_low,
                    "bottom": c1_high,
                    "midpoint": (c3_low + c1_high) / 2,
                    "filled": False,
                })

        # Bearish FVG
        elif c1_low > c3_high:
            gap = c1_low - c3_high
            if gap >= current_atr * min_gap_atr:
                fvgs.append({
                    "index": i,
                    "type": "bearish",
                    "top": c1_low,
                    "bottom": c3_high,
                    "midpoint": (c1_low + c3_high) / 2,
                    "filled": False,
                })
    return fvgs


def detect_fvg_signal(
    df: pd.DataFrame,
    min_gap_atr: float = 0.3,
    use_trend_filter: bool = True,
    ema_period: int = 200,
) -> dict:
    """
    Generate an FVG-based entry signal on the current candle.

    Args:
        df: OHLCV DataFrame
        min_gap_atr: Minimum gap size in ATR terms
        use_trend_filter: HTF EMA trend filtresi
        ema_period: EMA period for the trend filter

    Returns:
        Signal dict
    """
    if len(df) < ema_period + 5:
        return make_signal(reason="Insufficient data")

    fvgs = detect_fvgs(df, min_gap_atr)
    if not fvgs:
        return make_signal(reason="No FVG detected")

    current_price = df["close"].iloc[-1]
    current_atr = atr(df, 14).iloc[-1]
    trend_ema = ema(df["close"], ema_period).iloc[-1]
    trend = "up" if current_price > trend_ema else "down"

    # Find the most recent un-mitigated FVG
    for fvg in reversed(fvgs):
        if fvg["filled"]:
            continue

        # Mitigation check: did price touch the midpoint?
        if fvg["type"] == "bullish":
            # Touch of midpoint within last 10 candles
            recent = df.iloc[fvg["index"] + 1:]
            if len(recent) == 0:
                continue
            touched = (recent["low"] <= fvg["midpoint"]).any()
            if not touched:
                continue
            # Trend filtresi
            if use_trend_filter and trend != "up":
                continue
            # Entry condition: currently near midpoint and not fully filled yet
            if current_price > fvg["bottom"] and current_price < fvg["top"]:
                entry = fvg["midpoint"]
                stop_loss = fvg["bottom"] - (0.5 * current_atr)
                risk = entry - stop_loss
                tp1 = entry + (risk * 2)
                tp2 = entry + (risk * 3)
                tp3 = entry + (risk * 5)
                return make_signal(
                    signal="long",
                    entry=entry,
                    stop_loss=stop_loss,
                    take_profit=[tp1, tp2, tp3],
                    confidence=0.75 if use_trend_filter else 0.6,
                    reason=f"Bullish FVG mitigation at {fvg['midpoint']:.4f}",
                    timestamp=int(df.index[-1].timestamp()) if hasattr(df.index[-1], "timestamp") else None,
                    metadata={"fvg": fvg, "trend": trend},
                )

        else:  # bearish
            recent = df.iloc[fvg["index"] + 1:]
            if len(recent) == 0:
                continue
            touched = (recent["high"] >= fvg["midpoint"]).any()
            if not touched:
                continue
            if use_trend_filter and trend != "down":
                continue
            if current_price > fvg["bottom"] and current_price < fvg["top"]:
                entry = fvg["midpoint"]
                stop_loss = fvg["top"] + (0.5 * current_atr)
                risk = stop_loss - entry
                tp1 = entry - (risk * 2)
                tp2 = entry - (risk * 3)
                tp3 = entry - (risk * 5)
                return make_signal(
                    signal="short",
                    entry=entry,
                    stop_loss=stop_loss,
                    take_profit=[tp1, tp2, tp3],
                    confidence=0.75 if use_trend_filter else 0.6,
                    reason=f"Bearish FVG mitigation at {fvg['midpoint']:.4f}",
                    timestamp=int(df.index[-1].timestamp()) if hasattr(df.index[-1], "timestamp") else None,
                    metadata={"fvg": fvg, "trend": trend},
                )

    return make_signal(reason="No active FVG entry")


if __name__ == "__main__":
    # Test
    np.random.seed(42)
    dates = pd.date_range("2024-01-01", periods=300, freq="15min")
    close = 100 + np.cumsum(np.random.randn(300) * 0.5)
    df = pd.DataFrame({
        "open": close + np.random.randn(300) * 0.1,
        "high": close + abs(np.random.randn(300) * 0.3),
        "low": close - abs(np.random.randn(300) * 0.3),
        "close": close,
        "volume": np.random.randint(1000, 5000, 300),
    }, index=dates)
    signal = detect_fvg_signal(df)
    print(signal)
