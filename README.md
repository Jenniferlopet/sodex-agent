# SoDEX Agent Fresh — ENV Real Data Edition

Static Netlify tool with Netlify Functions. No Next.js runtime. No Tailwind. No exposed keys.

## What changed

This edition uses **real data from Netlify Environment Variables**:

1. Tries `SOSOVALUE_MARKET_URL` with `SOSOVALUE_API_KEY`.
2. If that fails, silently falls back to CoinGecko.
3. If CoinGecko fails, silently falls back to Binance public market data.
4. SoDEX base URL, paths, API header name, and API key are all configurable from env.

The frontend never receives API keys or private keys.

## Netlify build settings

Build command:

```txt
npm run build
```

Publish directory:

```txt
.
```

Functions directory:

```txt
netlify/functions
```

Do not enable Next.js Runtime or @netlify/plugin-nextjs.

## Required env

```env
NODE_VERSION=20
LIVE_TRADING=false
SODEX_ENV=testnet
```

## Real market env

```env
SOSOVALUE_API_KEY=your_key
SOSOVALUE_MARKET_URL=https://your-official-sosovalue-market-endpoint
SOSOVALUE_API_HEADER_NAME=X-API-Key
SOSOVALUE_AUTH_MODE=header
COINGECKO_API_KEY=optional
COINGECKO_IDS=bitcoin,ethereum,solana,chainlink,arbitrum
BINANCE_PAIRS=BTCUSDT,ETHUSDT,SOLUSDT,LINKUSDT,ARBUSDT
```

## Real SoDEX env

```env
SODEX_API_BASE_URL=https://official-sodex-api-base-url
SODEX_API_KEY_NAME=your_key_name_or_key
SODEX_API_HEADER_NAME=X-API-Key
SODEX_MARKETS_PATH=/api/markets
SODEX_ORDERBOOK_PATH=/api/orderbook?symbol={symbol}
SODEX_ACCOUNT_PATH=
DEFAULT_SODEX_SYMBOL=BTC-USDC
```

Keep `LIVE_TRADING=false` for verification. Only enable live orders after the official order endpoint and signing schema are confirmed.


## Language Policy

The AI Agent is configured to always answer in English, even when the user asks in Vietnamese or another language. This keeps the hackathon demo consistent and professional.
