"""
Premium/Discount + Optimal Trade Entry (OTE)
=============================================
A retracement into the 0.62-0.79 fibonacci zone of the last impulse = OTE.
Premium (above 0.5): short opportunity.
Discount (below 0.5): long opportunity.
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
import pandas as pd
import numpy as np
from common import make_signal, atr, swing_highs_lows, ema


def detect_ote_signal(
    df: pd.DataFrame,
    swing_lb: int = 10,
    fib_low: float = 0.62,
    fib_high: float = 0.79,
    use_trend_filter: bool = True,
    ema_period: int = 200,
) -> dict:
    if len(df) < ema_period + 20:
        return make_signal(reason="Insufficient data")

    sh, sl = swing_highs_lows(df, swing_lb)
    current_atr = atr(df, 14).iloc[-1]
    trend_ema = ema(df["close"], ema_period).iloc[-1]
    current = df.iloc[-1]
    trend = "up" if current["close"] > trend_ema else "down"

    # Son swing high & low'u bul
    sh_filled = sh.ffill()
    sl_filled = sl.ffill()
    last_sh = sh_filled.iloc[-1]
    last_sl = sl_filled.iloc[-1]
    last_sh_idx = sh.last_valid_index()
    last_sl_idx = sl.last_valid_index()

    if pd.isna(last_sh) or pd.isna(last_sl):
        return make_signal(reason="No swing structure")

    # Which is more recent? Determines impulse direction
    if last_sh_idx > last_sl_idx:
        # Last move up (sl -> sh) -> long discount setup
        impulse_low = last_sl
        impulse_high = last_sh
        ote_low = impulse_high - (impulse_high - impulse_low) * fib_high
        ote_high = impulse_high - (impulse_high - impulse_low) * fib_low
        if ote_low <= current["close"] <= ote_high:
            if use_trend_filter and trend != "up":
                return make_signal(reason="OTE zone reached but trend opposite")
            entry = (ote_low + ote_high) / 2
            stop_loss = impulse_low - 0.3 * current_atr
            risk = entry - stop_loss
            return make_signal(
                signal="long",
                entry=entry,
                stop_loss=stop_loss,
                take_profit=[entry + risk * 2, entry + risk * 3, impulse_high],
                confidence=0.77,
                reason=f"OTE long: {fib_low}-{fib_high} fib zone",
                metadata={"impulse_low": impulse_low, "impulse_high": impulse_high},
            )
    else:
        # Last move down (sh -> sl) -> short premium setup
        impulse_high = last_sh
        impulse_low = last_sl
        ote_low = impulse_low + (impulse_high - impulse_low) * fib_low
        ote_high = impulse_low + (impulse_high - impulse_low) * fib_high
        if ote_low <= current["close"] <= ote_high:
            if use_trend_filter and trend != "down":
                return make_signal(reason="OTE zone reached but trend opposite")
            entry = (ote_low + ote_high) / 2
            stop_loss = impulse_high + 0.3 * current_atr
            risk = stop_loss - entry
            return make_signal(
                signal="short",
                entry=entry,
                stop_loss=stop_loss,
                take_profit=[entry - risk * 2, entry - risk * 3, impulse_low],
                confidence=0.77,
                reason=f"OTE short: {fib_low}-{fib_high} fib zone",
                metadata={"impulse_low": impulse_low, "impulse_high": impulse_high},
            )

    return make_signal(reason="Price not in OTE zone")
