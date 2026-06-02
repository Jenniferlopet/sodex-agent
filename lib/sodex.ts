import { ethers } from 'ethers';
import { safeJson } from './http';

export const sodexConfig = () => {
  const env = process.env.SODEX_ENV === 'testnet' ? 'testnet' : 'mainnet';
  return {
    env,
    spot: process.env.SODEX_SPOT_ENDPOINT || (env === 'testnet' ? 'https://testnet-gw.sodex.dev/api/v1/spot' : 'https://mainnet-gw.sodex.dev/api/v1/spot'),
    perps: process.env.SODEX_PERPS_ENDPOINT || (env === 'testnet' ? 'https://testnet-gw.sodex.dev/api/v1/perps' : 'https://mainnet-gw.sodex.dev/api/v1/perps'),
    chainId: env === 'testnet' ? 138565 : 286623,
    accountID: process.env.SODEX_ACCOUNT_ID ? Number(process.env.SODEX_ACCOUNT_ID) : undefined,
    apiKeyName: process.env.SODEX_API_KEY_NAME,
    apiPrivateKey: process.env.SODEX_API_PRIVATE_KEY
  };
};

export function compactPayload(payload: any) { return JSON.stringify(payload); }
export function payloadHash(payload: any) { return ethers.keccak256(ethers.toUtf8Bytes(compactPayload(payload))); }

export async function signExchangeAction(payload: any, domainName: 'spot' | 'futures', nonce = Date.now()) {
  const cfg = sodexConfig();
  if (!cfg.apiPrivateKey || !cfg.apiKeyName) throw new Error('TRADING_KEY_NOT_CONFIGURED');
  const wallet = new ethers.Wallet(cfg.apiPrivateKey);
  const domain = { name: domainName, version: '1', chainId: cfg.chainId, verifyingContract: '0x0000000000000000000000000000000000000000' };
  const types = { ExchangeAction: [{ name: 'payloadHash', type: 'bytes32' }, { name: 'nonce', type: 'uint64' }] };
  const signature = await wallet.signTypedData(domain, types, { payloadHash: payloadHash(payload), nonce });
  return { nonce, signature: `0x01${signature.slice(2)}`, keyName: cfg.apiKeyName };
}

export async function getSodexMarkets() {
  const cfg = sodexConfig();
  const candidates = [`${cfg.spot}/markets/symbols`, `${cfg.perps}/markets/symbols`, `${cfg.spot}/public/symbols`, `${cfg.perps}/public/symbols`];
  for (const url of candidates) {
    const r = await safeJson<any>(url, { headers: { Accept: 'application/json' } });
    if (r.ok) return r.data;
  }
  return null;
}

export async function getSodexOrderbook(symbolID?: string) {
  const cfg = sodexConfig();
  const sid = symbolID || process.env.SODEX_DEFAULT_SYMBOL_ID || '1';
  const candidates = [`${cfg.spot}/orderbook?symbolID=${sid}`, `${cfg.spot}/depth?symbolID=${sid}`, `${cfg.perps}/orderbook?symbolID=${sid}`];
  for (const url of candidates) {
    const r = await safeJson<any>(url, { headers: { Accept: 'application/json' } });
    if (r.ok) return r.data;
  }
  return null;
}

export async function placeSodexOrder(input: { symbolID: number; side: number; quantity: string; price?: string; market?: 'spot' | 'perps' }) {
  if (process.env.LIVE_TRADING !== 'true') throw new Error('LIVE_TRADING_DISABLED');
  const cfg = sodexConfig();
  if (!cfg.accountID) throw new Error('ACCOUNT_ID_NOT_CONFIGURED');
  const market = input.market || 'spot';
  const actionType = 'batchNewOrder';
  const params = {
    accountID: cfg.accountID,
    orders: [{
      symbolID: input.symbolID,
      clOrdID: `agent-${Date.now()}`,
      side: input.side,
      type: input.price ? 1 : 2,
      timeInForce: 3,
      ...(input.price ? { price: input.price } : {}),
      quantity: input.quantity
    }]
  };
  const payload = { type: actionType, params };
  const sig = await signExchangeAction(payload, market === 'perps' ? 'futures' : 'spot');
  const endpoint = `${market === 'perps' ? cfg.perps : cfg.spot}/trade/orders`;
  const res = await safeJson<any>(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-Key': sig.keyName,
      'X-API-Sign': sig.signature,
      'X-API-Nonce': String(sig.nonce)
    },
    body: JSON.stringify(params)
  }, 12000);
  if (!res.ok) throw new Error('ORDER_REJECTED');
  return res.data;
}
