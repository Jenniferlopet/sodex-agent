# SoDEX Agent Console

Netlify-ready AI Web3 trading intelligence dashboard.

## What is inside

- Next.js 14 stable build
- No Tailwind / PostCSS dependency, so the Netlify Tailwind 4 error cannot happen
- Real market data with provider fallback
- Optional SoSoValue primary provider via environment variables
- SoDEX API routes for markets, orderbook, account and protected order verification
- No API keys in frontend
- `LIVE_TRADING=false` safe default

## Netlify build settings

Build command:

```bash
npm install --include=dev --legacy-peer-deps && npm run build
```

Publish directory:

```txt
.next
```

Node version:

```txt
20
```

## Required environment variables

```env
LIVE_TRADING=false
SODEX_ENV=testnet
SODEX_CHAIN_ID=13856
VALUECHAIN_RPC_URL=https://testnet.valuechain.xyz/
VALUECHAIN_USDC_ADDRESS=0x3fFe1f43c2Cb5C9c9ED23d8CF62dD7afABD4eE05
FALLBACK_MARKET_PROVIDER=coingecko
```

## Optional real API keys

Add these only in Netlify Environment Variables, never in code:

```env
SOSOVALUE_API_KEY=
SOSOVALUE_MARKET_URL=
SODEX_API_BASE_URL=
SODEX_API_KEY_NAME=
SODEX_API_PRIVATE_KEY=
SODEX_ACCOUNT_ID=
```

## Important

If your Netlify site already has `NPM_FLAGS=--production` or `NPM_FLAGS=--omit=dev`, delete it. This ZIP also puts all required build packages in `dependencies` and uses a build command that installs dependencies before building.
