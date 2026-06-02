# SoDEX Agent Console Pro

**SoDEX Agent Console Pro** is a SoDEX-first AI market intelligence terminal for the SoSoValue × SoDEX buildathon concept: **SoSoValue Brain × SoDEX Hands**.

It loads the live SoDEX market universe server-side, visualizes top liquid tokens, and provides a professional English-only AI Agent for risk, rebalance, market-signal, orderbook, and protected execution planning.

## What this version improves

- SoDEX-first market loading through `SODEX_MARKETS_PATH=/markets/tickers`.
- Designed for large token universes: hundreds of loaded SoDEX assets can be tracked.
- Dashboard count shows the full loaded universe.
- Chart shows top liquid assets by 24h volume, using 24h % change instead of raw price.
- Scrollable asset table supports search and sorting.
- AI Agent answers in polished English only.
- Gemini API support for free/low-cost AI responses.
- Local pro fallback if Gemini is not configured or temporarily unavailable.
- No Next.js runtime. Static frontend + Netlify Functions only.
- API keys and private keys stay server-side in Netlify Environment Variables.
- Live trading stays off by default.

## Netlify build settings

Use a clean Netlify site without Next.js Runtime or `@netlify/plugin-nextjs`.

```txt
Build command: npm run build
Publish directory: .
Functions directory: netlify/functions
```

## Environment variables

```env
NODE_VERSION=20
LIVE_TRADING=false

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

SODEX_ENV=testnet
SODEX_API_BASE_URL=https://api.sodex.com
SODEX_API_KEY_NAME=
SODEX_API_PRIVATE_KEY=
SODEX_API_HEADER_NAME=X-API-Key
SODEX_MARKETS_PATH=/markets/tickers
SODEX_MINI_TICKERS_PATH=/markets/miniTickers
SODEX_ORDERBOOK_PATH=/markets/{symbol}/orderbook
SODEX_KLINES_PATH=/markets/{symbol}/klines
DEFAULT_SODEX_SYMBOL=vBTC_vUSDC
SODEX_ACCOUNT_PATH=
SODEX_ORDER_PATH=

SOSOVALUE_API_KEY=
SOSOVALUE_MARKET_URL=
SOSOVALUE_API_HEADER_NAME=X-API-Key
SOSOVALUE_AUTH_MODE=header

COINGECKO_API_KEY=
COINGECKO_IDS=bitcoin,ethereum,solana,chainlink,arbitrum,optimism,uniswap,aave,maker,lido-dao,near,render-token,internet-computer,ondo-finance,jupiter-exchange-solana
BINANCE_PAIRS=BTCUSDT,ETHUSDT,SOLUSDT,LINKUSDT,ARBUSDT,OPUSDT,UNIUSDT,AAVEUSDT,MKRUSDT,LDOUSDT,NEARUSDT,RNDRUSDT,ICPUSDT,ONDOUSDT,JUPUSDT
PROVIDER_TIMEOUT_MS=9000
MARKET_LIMIT=250
CHART_LIMIT=28
TABLE_LIMIT=120
```

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

This project is for demo, education, and hackathon verification. It does not provide guaranteed financial advice.

Keep this setting for demos:

```env
LIVE_TRADING=false
```

Only switch live trading on after the official SoDEX signing and order format have been fully tested.
