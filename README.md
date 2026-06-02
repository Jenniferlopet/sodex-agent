# SoDEX Agent Console Pro — UI Fixed

A SoDEX-first AI market terminal for tracking a large live token universe, reading market risk, and preparing protected execution checks with secrets kept server-side.

## What changed in this build

- Fixed the broken layout on medium screens.
- Removed the squeezed AI Agent sidebar issue.
- Added responsive one-column fallback below 1180px.
- Added sticky AI panel only on wide screens.
- Added scrollable chart and scrollable asset table.
- Chart supports a larger token universe and visualizes 24h % move, not raw token price.
- AI Agent stays English-only and uses Gemini API if configured.
- No Next.js runtime. Static frontend + Netlify Functions only.

## Netlify build settings

```txt
Build command: npm run build
Publish directory: .
Functions directory: netlify/functions
```

## Required environment variables

```env
NODE_VERSION=20
LIVE_TRADING=false

GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODEL=gemini-1.5-flash

SOSOVALUE_API_KEY=YOUR_SOSOVALUE_API_KEY
SOSOVALUE_MARKET_URL=
SOSOVALUE_API_HEADER_NAME=X-API-Key
SOSOVALUE_AUTH_MODE=header

COINGECKO_IDS=bitcoin,ethereum,solana,chainlink,arbitrum
BINANCE_PAIRS=BTCUSDT,ETHUSDT,SOLUSDT,LINKUSDT,ARBUSDT
PROVIDER_TIMEOUT_MS=9000

SODEX_ENV=testnet
SODEX_API_BASE_URL=https://api.sodex.com
SODEX_API_KEY_NAME=YOUR_SODEX_API_KEY_NAME
SODEX_API_PRIVATE_KEY=YOUR_SODEX_PRIVATE_KEY
SODEX_API_HEADER_NAME=X-API-Key
SODEX_MARKETS_PATH=/markets/tickers
SODEX_MINI_TICKERS_PATH=/markets/miniTickers
SODEX_ORDERBOOK_PATH=/markets/{symbol}/orderbook
SODEX_KLINES_PATH=/markets/{symbol}/klines
DEFAULT_SODEX_SYMBOL=vBTC_vUSDC
```

## Safety

Live trading is disabled by default. Keep:

```env
LIVE_TRADING=false
```

Only enable live trading after the official SoDEX signing flow and order format are fully verified.
