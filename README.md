# SoDEX Agent Console - Netlify Static

This version avoids Next.js completely to prevent Netlify dependency/build failures.

## Deploy

1. Copy this folder to your GitHub repo root.
2. In Netlify, import the repo.
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
4. Environment variables:
   - `LIVE_TRADING=false`
   - `SODEX_ENV=testnet`
   - Optional: `SODEX_API_KEY_NAME`, `SODEX_API_PRIVATE_KEY`, `SODEX_ACCOUNT_ID`, `SOSOVALUE_API_KEY`

## API Routes

- `/api/market/overview`
- `/api/agent`
- `/api/sodex/markets`
- `/api/sodex/orderbook?symbol=BTC-USDC`
- `/api/sodex/account`
- `/api/sodex/order`
- `/api/health`

No API keys are exposed in frontend JavaScript.
