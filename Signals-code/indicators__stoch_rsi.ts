import { Candle, Signal, makeSignal, ema, sma, rsi, atr, bollingerBands } from '../indicators';

// 9. Stochastic RSI - momentum oscillator
export function stochRsi(c: Candle[]): Signal {
