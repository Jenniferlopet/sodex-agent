'use client';
import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Bot, LockKeyhole, RadioTower, ShieldCheck, Sparkles, Wallet } from 'lucide-react';

type MarketItem = { symbol: string; name: string; price: number; change24h: number; volume: number; marketCap?: number };

const fmt = (n: number) => n >= 1 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toPrecision(4);

export default function Home() {
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [prompt, setPrompt] = useState('Give me today market risk and a rebalance idea');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/market/overview').then(r => r.json()).then(j => setMarket(j.data || [])).catch(() => setMarket([]));
  }, []);

  async function askAgent() {
    setBusy(true);
    try {
      const r = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const j = await r.json();
      setAnswer(j.answer || 'No answer.');
    } finally { setBusy(false); }
  }

  const chart = market.slice(0, 10).map((x, i) => ({ name: x.symbol, value: Math.max(0, 100 + Number(x.change24h || 0) + i * .8) }));

  return <main className="grid-bg min-h-screen px-5 py-6 md:px-10">
    <nav className="mx-auto flex max-w-7xl items-center justify-between py-2">
      <div className="flex items-center gap-3"><div className="rounded-2xl bg-orange-500 p-2 text-black"><Sparkles size={22}/></div><div><h1 className="text-xl font-black tracking-tight">SoDEX Agent Console</h1><p className="text-xs text-zinc-400">Real market data • Agentic strategy • Server-side keys</p></div></div>
      <div className="hidden gap-2 md:flex"><span className="badge"><ShieldCheck size={13} className="inline"/> No secret in browser</span><span className="badge"><RadioTower size={13} className="inline"/> Live data</span></div>
    </nav>

    <section className="mx-auto mt-8 grid max-w-7xl gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <div className="card p-7 md:p-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5"><div><p className="mb-3 text-sm font-semibold text-orange-400">AI BUILDATHON WAVE 2</p><h2 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Automated trading intelligence for SoDEX users.</h2><p className="mt-4 max-w-2xl text-zinc-300">One dashboard for market signals, risk monitoring, orderbook checks, and agent strategy. If primary APIs fail, the server quietly switches to public exchange data.</p></div><div className="rounded-3xl border border-orange-400/30 bg-orange-500/10 p-4"><Wallet className="text-orange-300"/></div></div>
        <div className="h-72 rounded-3xl border border-white/10 bg-black/30 p-4">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopOpacity=".6"/><stop offset="100%" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="name" stroke="#777"/><YAxis stroke="#777"/><Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16 }}/><Area dataKey="value" stroke="currentColor" fill="url(#g)" strokeWidth={3}/></AreaChart></ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3"><Bot className="text-orange-400"/><h3 className="text-2xl font-bold">Trading Agent</h3></div>
        <textarea className="input min-h-32" value={prompt} onChange={e => setPrompt(e.target.value)} />
        <button className="btn mt-3 w-full" disabled={busy} onClick={askAgent}>{busy ? 'Thinking...' : 'Ask agent'}</button>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-zinc-200">{answer || 'Ask for portfolio risk, rebalance idea, or order preparation.'}</div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-white/5 p-4"><Activity className="mb-2 text-orange-400"/>Signals</div><div className="rounded-2xl bg-white/5 p-4"><LockKeyhole className="mb-2 text-orange-400"/>Server keys</div></div>
      </div>
    </section>

    <section className="mx-auto mt-5 grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
      {market.slice(0, 8).map(x => <div key={x.symbol} className="card p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-zinc-400">{x.name}</p><h4 className="text-2xl font-black">{x.symbol}</h4></div><span className={`rounded-full px-3 py-1 text-xs ${Number(x.change24h) >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{Number(x.change24h).toFixed(2)}%</span></div><p className="mt-5 text-3xl font-bold">${fmt(Number(x.price))}</p><p className="mt-2 text-xs text-zinc-500">Volume ${fmt(Number(x.volume || 0))}</p></div>)}
    </section>
  </main>;
}
