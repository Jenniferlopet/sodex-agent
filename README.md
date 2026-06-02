# SoDEX Agent Console

Production-ready MVP for a SoSoValue/SoDEX AI Buildathon-style tool.

## What it does
- Shows live crypto market data.
- Tries SoSoValue first when API env is configured.
- Silently falls back to CoinGecko, then Binance if the primary API fails.
- Provides an agent chat for market risk and rebalance ideas.
- Includes server-side SoDEX signing utilities using EIP-712 style payload hashing.
- Keeps API keys and private keys only in server environment variables.
- Hides provider errors and does not expose verification/fallback details in the deployed UI.

## Important safety note
Live trading is disabled by default. To enable real SoDEX order execution, set `LIVE_TRADING=true` and add valid SoDEX API key name, private key, and account ID in deployment environment variables. Never commit `.env` files.

## Deploy on Vercel
1. Push this folder to GitHub.
2. Import the repository on Vercel.
3. Add environment variables from `.env.example`.
4. Deploy.

## Main routes
- `/` dashboard
- `/api/market/overview` market data with silent fallback
- `/api/agent` agent response
- `/api/sodex/markets` SoDEX symbols/markets proxy
- `/api/sodex/orderbook` SoDEX orderbook proxy
- `/api/sodex/order` live order endpoint, gated by `LIVE_TRADING=true`

## Env vars
Copy `.env.example` to `.env.local` for development, or set values directly in Vercel.
