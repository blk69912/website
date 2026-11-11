"use client";
import { useState } from "react";
import { estimateCost, PRESETS, PRICING_AS_OF, PRICING_SOURCE } from "@/lib/pricing";

const usd = (n: number) => (n < 0.01 && n > 0 ? `$${n.toFixed(5)}` : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 100 ? 2 : 0 }));

export function CostTool() {
  const [preset, setPreset] = useState(PRESETS[1].id);
  const p = PRESETS.find((x) => x.id === preset)!;
  const [prices, setPrices] = useState({ input: p.input, output: p.output, cacheRead: p.cacheRead });
  const [v, setV] = useState({ inputTokens: 20000, outputTokens: 1500, requestsPerDay: 1000, cachedShare: 0.6 });
  const c = estimateCost({ ...v, inputPrice: prices.input, outputPrice: prices.output, cacheReadPrice: prices.cacheRead });
  const choose = (id: string) => {
    const n = PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setPrices({ input: n.input, output: n.output, cacheRead: n.cacheRead });
  };
  const num = (label: string, value: number, set: (n: number) => void, step = 1, id = label) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={id} type="number" min={0} step={step} className="field tabular-nums" value={value} onChange={(e) => set(Math.max(0, Number(e.target.value)))} />
    </div>
  );
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-2 font-semibold">Model and price per million tokens</legend>
          <select aria-label="Model preset" className="field max-w-md" value={preset} onChange={(e) => choose(e.target.value)}>
            {PRESETS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {num("Input ($)", prices.input, (n) => setPrices({ ...prices, input: n }), 0.01, "pin")}
            {num("Output ($)", prices.output, (n) => setPrices({ ...prices, output: n }), 0.01, "pout")}
            {num("Cache read ($)", prices.cacheRead, (n) => setPrices({ ...prices, cacheRead: n }), 0.01, "pcache")}
          </div>
          <p className="mt-2 text-sm text-muted">
            Presets are Anthropic list prices as of {PRICING_AS_OF}. {p.cacheReadEstimated ? "The cache read price for this preset is an estimate. " : ""}Check the <a href={PRICING_SOURCE}>current pricing page</a> before budgeting.
          </p>
        </fieldset>
        <fieldset>
          <legend className="mb-2 font-semibold">Traffic</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {num("Input tokens per request", v.inputTokens, (n) => setV({ ...v, inputTokens: n }), 100, "it")}
            {num("Output tokens per request", v.outputTokens, (n) => setV({ ...v, outputTokens: n }), 100, "ot")}
            {num("Requests per day", v.requestsPerDay, (n) => setV({ ...v, requestsPerDay: n }), 10, "rpd")}
          </div>
          <label htmlFor="cache" className="mt-4 block text-sm font-medium">Share of input read from cache: {Math.round(v.cachedShare * 100)}%</label>
          <input id="cache" type="range" min={0} max={0.95} step={0.05} value={v.cachedShare} onChange={(e) => setV({ ...v, cachedShare: Number(e.target.value) })} className="w-full max-w-md accent-[#2346d8]" />
          <p className="text-sm text-muted">A stable system prompt and tool list at the start of every request is what makes caching pay off. Cache writes cost extra and are not modeled here.</p>
        </fieldset>
      </div>
      <dl className="panel h-fit divide-y divide-rule" aria-live="polite">
        {[["Per request", c.perRequest], ["Per day", c.perDay], ["Per 30 days", c.perMonth]].map(([k, n], i) => (
          <div key={k as string} className="p-4">
            <dt className="text-muted">{k}</dt>
            <dd className={`tabular-nums font-bold ${i === 2 ? "text-4xl" : "text-2xl"}`}>{usd(n as number)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
