# SoDEX Agent

**SoDEX Agent** is a SoDEX-first agentic market terminal built for the SoSoValue, SoDEX, and ValueChain ecosystem. It combines live token-universe tracking, AI market intelligence, signal scanning, paper trading, and protected execution checks in one Netlify-ready tool.

## Overview

SoDEX Agent is designed around one simple workflow:

```txt
Market Intelligence → Signal Insights → Risk Review → Demo Execution → Protected SoDEX Check
```

SoSoValue acts as the intelligence layer for market context and research.  
SoDEX acts as the execution layer for trading workflows.  
ValueChain provides the on-chain environment for testing and deployment-ready Web3 actions.

The tool is built for fast demos, hackathon verification, and practical market monitoring without exposing sensitive API keys on the frontend.

## Core Features

### Live SoDEX Market Universe

SoDEX Agent tracks live market data from configured server-side providers and prioritizes the SoDEX market universe when available.

It supports:

- Token universe monitoring
- 24h price movement
- 24h volume ranking
- Top liquid assets
- Searchable asset table
- SoDEX watchlist support
- Fallback live market data when a provider is unavailable
- Live stock-style focus chart with 1D / 1W / 1M / 3M / 1Y ranges

### AI Market Agent

The built-in AI Agent can assist with:

- Market brief generation
- Risk review
- Rebalance suggestions
- Trading signal interpretation
- Gas and execution awareness
- Protected order-readiness checks

Responses are designed to be clear, English-only, and suitable for product demos.

### Signal Scanner

The Signal Scanner evaluates market assets using multiple signal categories and ranks potential signals based on confluence.

It includes:

- LONG / SHORT signal ranking
- Confluence scoring
- Momentum and risk filters
- Asset-level signal summaries
- Signal category insights

### Signal Library

SoDEX Agent includes a large built-in signal library for demo analysis and signal exploration.

Users can browse signal logic, inspect source snippets, and understand how different market conditions may trigger different signal views.

### Demo Trade Terminal

The Demo Trade Terminal allows users to test signal ideas without sending real orders.

It supports:

- Paper trading
- Virtual balance
- Leverage simulation
- Position tracking
- PnL calculation
- ROE-style performance view
- Equity curve tracking

Demo trading is local-only and does not execute real transactions.

### Signal Playground

The Signal Playground lets users test custom JavaScript signal logic in a browser Worker sandbox.

It is designed for safe experimentation and does not expose private backend credentials.

### Protected SoDEX Execution Layer

The execution layer prepares SoDEX order-readiness checks while keeping real trading disabled by default.

```env
LIVE_TRADING=false
```

Real execution should only be enabled after the official SoDEX signing format, nonce handling, and order schema are fully verified.

## Safety Design

SoDEX Agent is designed with demo safety and key protection in mind.

- API keys stay server-side in Netlify Environment Variables.
- The frontend never receives SoDEX private keys.
- SoSoValue and SoDEX credentials are not exposed in browser code.
- Live trading is disabled by default.
- Paper trading is local-only.
- Provider failures are handled silently.
- The UI avoids exposing internal endpoints or secret provider details.

## API Routes

The tool uses Netlify Functions for protected API access:

```txt
/api/health
/api/market/overview
/api/agent
/api/sodex/markets
/api/sodex/orderbook
/api/sodex/account
/api/sodex/order
/api/chart
```

## Netlify Deployment

Recommended Netlify settings:

```txt
Build command: npm run build
Publish directory: .
Functions directory: netlify/functions
```

Do **not** enable Next.js Runtime or `@netlify/plugin-nextjs` for this static version.

## Environment Variables

Add these variables in Netlify:

```env
NODE_VERSION=20
LIVE_TRADING=false

GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODEL=gemini-1.5-flash

SOSOVALUE_API_KEY=YOUR_SOSOVALUE_API_KEY
SOSOVALUE_MARKET_URL=
SOSOVALUE_API_HEADER_NAME=X-API-Key
SOSOVALUE_AUTH_MODE=header

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

MARKET_LIMIT=400
TABLE_LIMIT=220
CHART_LIMIT=80
SHOW_SODEX_WATCHLIST=true
```

## Demo Script

Use this short explanation during the demo:

```txt
SoDEX Agent connects market intelligence with protected trading workflow. It reads live market data, scans assets for signal confluence, lets users test ideas through paper trading, and prepares SoDEX execution checks without exposing keys or sending real orders by default.
```

## Built With

- SoSoValue
- SoDEX
- ValueChain
- AI Agent
- Netlify Functions
- Static Web App
- Server-side Environment Variables

## Category

Tools

## Tags

```txt
#SoSoValue
#SoDEX
#ValueChain
#Agentic
#One-Person
#On-Chain-Finance
#AIxWeb3
```

## Disclaimer

SoDEX Agent is an educational and hackathon demo tool. It does not provide guaranteed financial advice. Live trading should remain disabled until the official SoDEX signing and order format has been fully verified.
