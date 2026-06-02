# SoDEX Agent Console

**SoDEX Agent Console** is a lightweight AI Web3 trading intelligence dashboard for the SoSoValue × SoDEX ecosystem.

It combines live crypto market data, a protected server-side ENV API layer, a Gemini-powered AI Agent option, and SoDEX execution preparation without exposing keys on the frontend.

## What it does

- Shows live crypto market data.
- Visualizes 24h market change with a readable chart.
- Lets users ask an AI Agent about risk, rebalance, gas fees, market signals, and SoDEX execution.
- Keeps API keys and private keys server-side in Netlify Environment Variables.
- Uses live fallback providers if the main provider is unavailable.
- Keeps live trading disabled by default for safe verification.

## Why this exists

SoSoValue is the **brain**: market data, research, signals, and intelligence.

SoDEX is the **hands**: execution, trading flow, and on-chain action.

This tool connects both ideas into one agentic console.

## Tech stack

- Static HTML/CSS/JavaScript frontend
- Netlify Functions backend
- Server-side ENV providers
- Optional Gemini API for free AI Agent responses
- SoSoValue API-ready configuration
- SoDEX API-ready configuration
- CoinGecko/Binance live fallback data

## Netlify build settings

Use a new clean Netlify site or remove any old Next.js Runtime/plugin.

```txt
Build command: npm run build
Publish directory: .
Functions directory: netlify/functions
```

Do **not** enable Next.js Runtime. This project is static and does not use Next.js.

## Environment variables

Copy these into Netlify Environment Variables:

```env
NODE_VERSION=20
LIVE_TRADING=false

# Optional free AI Agent provider
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-flash

# SoSoValue API
SOSOVALUE_API_KEY=YOUR_SOSOVALUE_API_KEY
SOSOVALUE_MARKET_URL=
SOSOVALUE_API_HEADER_NAME=X-API-Key
SOSOVALUE_AUTH_MODE=header

# Real fallback market data
COINGECKO_IDS=bitcoin,ethereum,solana,chainlink,arbitrum
BINANCE_PAIRS=BTCUSDT,ETHUSDT,SOLUSDT,LINKUSDT,ARBUSDT
PROVIDER_TIMEOUT_MS=9000

# SoDEX API
SODEX_ENV=testnet
SODEX_API_BASE_URL=https://api.sodex.com
SODEX_API_KEY_NAME=YOUR_SODEX_API_KEY_NAME
SODEX_API_PRIVATE_KEY=YOUR_SODEX_PRIVATE_KEY
SODEX_API_HEADER_NAME=X-API-Key

# SoDEX endpoints
SODEX_MARKETS_PATH=/markets/tickers
SODEX_MINI_TICKERS_PATH=/markets/miniTickers
SODEX_ORDERBOOK_PATH=/markets/{symbol}/orderbook
SODEX_KLINES_PATH=/markets/{symbol}/klines
DEFAULT_SODEX_SYMBOL=vBTC_vUSDC
```

## AI Agent

The AI Agent works in two layers:

1. If `GEMINI_API_KEY` is set, the backend calls Gemini from Netlify Functions.
2. If Gemini is missing or unavailable, the tool silently falls back to a local rule-based agent.

This means the button still answers during demos even if the AI provider is unavailable.

## API routes

```txt
/api/health
/api/market/overview
/api/agent
/api/sodex/markets
/api/sodex/orderbook
/api/sodex/account
/api/sodex/order
```

## Safety

Default mode:

```env
LIVE_TRADING=false
```

This prevents accidental live execution. Do not set `LIVE_TRADING=true` until SoDEX signing, nonce, account ID, and order payload format are fully verified.

## Local build check

```bash
npm install
npm run build
```

Expected output:

```txt
Static SoDEX Agent build OK
```

## Disclaimer

This project is for hackathon, demo, and educational purposes. It is not financial advice. Users must verify all trading decisions and API signing logic before any live execution.
