"use client";

import { useEffect, useMemo, useState } from "react";

type MarketItem = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
};

export default function Page() {
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("Analyze BTC, ETH and SOL portfolio risk");
  const [answer, setAnswer] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  async function loadMarket() {
    setLoading(true);
    try {
      const res = await fetch("/api/market/overview", { cache: "no-store" });
      const payload = await res.json();
      setMarket(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setMarket([]);
    } finally {
      setLoading(false);
    }
  }

  async function askAgent() {
    setAnswer("Thinking...");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setAnswer(data.answer || "Agent response unavailable.");
    } catch {
      setAnswer("Agent is temporarily unavailable. Try again later.");
    }
  }

  async function verifyOrder() {
    setOrderStatus("Preparing protected order verification...");
    try {
      const res = await fetch("/api/sodex/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: "BTC-USDC", side: "buy", type: "market", amount: "0.01" })
      });
      const data = await res.json();
      setOrderStatus(data.message || "Order verification completed.");
    } catch {
      setOrderStatus("Order module temporarily unavailable.");
    }
  }

  useEffect(() => {
    loadMarket();
  }, []);

  const avgChange = useMemo(() => {
    if (!market.length) return 0;
    return market.reduce((sum, item) => sum + Number(item.change24h || 0), 0) / market.length;
  }, [market]);

  const totalVolume = useMemo(() => {
    return market.reduce((sum, item) => sum + Number(item.volume24h || 0), 0);
  }, [market]);

  const maxPrice = Math.max(...market.map((item) => Number(item.price || 0)), 1);

  return (
    <main className="main">
      <section className="shell">
        <div className="hero">
          <div>
            <p className="kicker">AI Web3 Trading Intelligence</p>
            <h1>SoDEX Agent Console</h1>
            <p className="sub">
              Real market dashboard with silent fallback data, AI strategy assistant and safe server-side SoDEX execution layer for deploy verification.
            </p>
          </div>
          <div className="badge">Protected deploy mode · No client-side secrets</div>
        </div>

        <div className="grid3">
          <Stat title="Tracked Assets" value={String(market.length || 0)} />
          <Stat title="Average 24h Change" value={`${avgChange.toFixed(2)}%`} />
          <Stat title="Market Volume" value={`$${compact(totalVolume)}`} />
        </div>

        <div className="grid2">
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Market Overview</h2>
                <p className="muted">Primary API first, exchange fallback silently. Provider errors are never exposed in UI.</p>
              </div>
              <button className="btn" onClick={loadMarket}>Refresh</button>
            </div>

            <div className="chart" aria-label="Market price chart">
              {loading ? (
                <p className="muted">Loading real market data...</p>
              ) : market.length ? (
                market.map((item) => (
                  <div className="bar-wrap" key={item.symbol} title={`${item.symbol}: $${formatNumber(item.price)}`}>
                    <div className="bar" style={{ height: `${Math.max(10, (Number(item.price || 0) / maxPrice) * 230)}px` }} />
                    <div className="bar-label">{item.symbol}</div>
                  </div>
                ))
              ) : (
                <p className="muted">No market rows available.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2>AI Agent</h2>
            <p className="muted">Ask about risk, rebalance, market movement, gas cost or order execution.</p>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <button className="btn-full" onClick={askAgent}>Ask Agent</button>
            {answer ? <div className="answer">{answer}</div> : null}
          </div>
        </div>

        <div className="grid2">
          <div className="card">
            <h2>Assets</h2>
            <p className="muted">Live data when providers are reachable, protected fallback when they are not.</p>
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Price</th>
                    <th>24h</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {market.map((item) => (
                    <tr key={item.symbol}>
                      <td className="asset">{item.symbol}<small>{item.name}</small></td>
                      <td>${formatNumber(item.price)}</td>
                      <td className={item.change24h >= 0 ? "pos" : "neg"}>{item.change24h.toFixed(2)}%</td>
                      <td>${compact(item.volume24h)}</td>
                    </tr>
                  ))}
                  {!market.length && !loading ? (
                    <tr><td colSpan={4} className="muted">No assets available.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2>SoDEX Execution Layer</h2>
            <p className="muted">Credentials stay server-side. Live execution is blocked unless LIVE_TRADING=true and production signing is confirmed.</p>
            <div className="ticket">
              <div className="row"><span>Pair</span><strong>BTC-USDC</strong></div>
              <div className="row"><span>Side</span><strong style={{ color: "var(--green)" }}>BUY</strong></div>
              <div className="row"><span>Amount</span><strong>0.01 BTC</strong></div>
              <div className="row"><span>Mode</span><strong>Verification</strong></div>
            </div>
            <button className="btn-full btn-safe" onClick={verifyOrder}>Verify Order</button>
            {orderStatus ? <div className="answer">{orderStatus}</div> : null}
            <p className="footer-note">Do not expose API keys in frontend. Add keys only in Netlify Environment Variables.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function compact(value: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en", { maximumFractionDigits: value > 1000 ? 0 : 4 }).format(value);
}
