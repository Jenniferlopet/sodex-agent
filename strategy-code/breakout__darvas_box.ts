import { Candle, Signal, makeSignal, sma, atr, swingHighs, swingLows } from '../indicators';

// 4. Darvas Box — box consolidation after new high, break the box
export function darvasBox(c: Candle[]): Signal {
