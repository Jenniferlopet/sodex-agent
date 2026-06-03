"""
Breaker Block Strategy
======================
Failed OB = breaker block. Works opposite to the original OB direction.

If bullish OB fails (price drops below and closes) -> Bearish Breaker.
If bearish OB fails -> Bullish Breaker.
Entry in the opposite direction on retest.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
from common import make_signal, atr, ema
from smc.python.order_block import detect_order_blocks


def detect_breaker_signal(
    df: pd.DataFrame,
    use_trend_filter: bool = True,
    ema_period: int = 200,
) -> dict:
    if len(df) < ema_period + 20:
        return make_signal(reason="Insufficient data")

    obs = detect_order_blocks(df, impulse_atr=1.2, lookback=80)
    current_atr = atr(df, 14).iloc[-1]
    current = df.iloc[-1]
    trend_ema = ema(df["close"], ema_period).iloc[-1]
    trend = "up" if current["close"] > trend_ema else "down"

    for ob in obs:
        # Bullish OB failed: closed below -> Bearish breaker (upper bound)
        post = df.iloc[ob["index"] + 2:]
        if ob["type"] == "bullish":
            broken = (post["close"] < ob["bottom"]).any()
            if broken:
                # Now if price returns to this level -> short
                breaker_top = ob["top"]
                breaker_bottom = ob["bottom"]
                if current["high"] >= breaker_bottom and current["low"] <= breaker_top:
                    if use_trend_filter and trend != "down":
                        continue
                    entry = (breaker_top + breaker_bottom) / 2
                    stop_loss = breaker_top + 0.5 * current_atr
                    risk = stop_loss - entry
                    return make_signal(
                        signal="short",
                        entry=entry,
                        stop_loss=stop_loss,
                        take_profit=[entry - risk * 2, entry - risk * 3, entry - risk * 5],
                        confidence=0.74,
                        reason="Bearish breaker (failed bullish OB)",
                        metadata={"original_ob": ob},
                    )

        elif ob["type"] == "bearish":
            broken = (post["close"] > ob["top"]).any()
            if broken:
                breaker_top = ob["top"]
                breaker_bottom = ob["bottom"]
                if current["high"] >= breaker_bottom and current["low"] <= breaker_top:
                    if use_trend_filter and trend != "up":
                        continue
                    entry = (breaker_top + breaker_bottom) / 2
                    stop_loss = breaker_bottom - 0.5 * current_atr
                    risk = entry - stop_loss
                    return make_signal(
                        signal="long",
                        entry=entry,
                        stop_loss=stop_loss,
                        take_profit=[entry + risk * 2, entry + risk * 3, entry + risk * 5],
                        confidence=0.74,
                        reason="Bullish breaker (failed bearish OB)",
                        metadata={"original_ob": ob},
                    )

    return make_signal(reason="No breaker setup")
