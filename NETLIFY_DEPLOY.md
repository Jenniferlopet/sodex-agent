# Deploy SoDEX Agent Console on Netlify

## Deploy settings

Build command:

```bash
npm run build
```

Publish directory:

```bash
.next
```

Node version:

```bash
20
```

The repo already includes `netlify.toml` and `@netlify/plugin-nextjs`.

## Environment variables

Add these in Netlify: Site configuration → Environment variables.

Required for safe demo:

```env
LIVE_TRADING=false
SODEX_ENV=testnet
SODEX_API_BASE=https://api.sodex.com
SODEX_TESTNET_API_BASE=https://api-testnet.sodex.com
SODEX_CHAIN_ID=13856
VALUECHAIN_RPC_URL=https://testnet.valuechain.xyz/
VALUECHAIN_USDC_ADDRESS=0x3fFe1f43c2Cb5C9c9ED23d8CF62dD7afABD4eE05
FALLBACK_MARKET_PROVIDER=coingecko
```

Optional/real keys:

```env
SOSOVALUE_API_KEY=your_sosovalue_key
SODEX_API_KEY_NAME=your_sodex_api_key_name
SODEX_API_PRIVATE_KEY=your_sodex_private_key
SODEX_ACCOUNT_ID=your_account_id
```

For real live order execution, set:

```env
LIVE_TRADING=true
```

Keep it `false` while judges verify the demo.
