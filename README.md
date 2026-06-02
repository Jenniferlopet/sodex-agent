# SoDEX Agent Fresh

A fresh Netlify static + serverless implementation. It does not use Next.js, Tailwind, Turbopack, or React, so it avoids the Netlify Next.js runtime errors.

## Netlify settings

- Base directory: empty
- Package directory: empty
- Build command: `npm run build`
- Publish directory: `.`
- Functions directory: `netlify/functions`

Remove any existing Netlify Next.js Runtime / @netlify/plugin-nextjs from the old site, or create a new Netlify site.

## Environment variables

Start with:

```env
LIVE_TRADING=false
SODEX_ENV=testnet
NODE_VERSION=20
```

Optional:

```env
SOSOVALUE_API_KEY=...
SODEX_API_KEY_NAME=...
SODEX_API_PRIVATE_KEY=...
SODEX_ACCOUNT_ID=...
```

## Safety

Live trading is disabled by default. The frontend never receives API keys or private keys.
