// Presets are Anthropic first-party list prices per million tokens.
// Source: Anthropic model pricing table, retrieved 2026-10-06. Edit freely in the UI.
export const PRICING_AS_OF = "2026-10-06";
export const PRICING_SOURCE = "https://platform.claude.com/docs/en/about-claude/pricing";

export interface PricePreset { id: string; label: string; input: number; output: number; cacheRead: number; cacheReadEstimated?: boolean }

export const PRESETS: PricePreset[] = [
  { id: "claude-fable-5-1", label: "Claude Fable 5.1", input: 10, output: 50, cacheRead: 0.25 },
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", input: 4, output: 20, cacheRead: 0.2 },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", input: 2, output: 10, cacheRead: 0.2 },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (prompts up to 100K)", input: 0.1, output: 0.5, cacheRead: 0.01, cacheReadEstimated: true },
  { id: "custom", label: "Custom price", input: 1, output: 5, cacheRead: 0.1, cacheReadEstimated: true },
];

export interface CostInput { inputTokens: number; outputTokens: number; requestsPerDay: number; inputPrice: number; outputPrice: number; cachedShare: number; cacheReadPrice: number }

export function estimateCost(c: CostInput) {
  const cached = c.inputTokens * c.cachedShare;
  const fresh = c.inputTokens - cached;
  const perRequest = (fresh * c.inputPrice + cached * c.cacheReadPrice + c.outputTokens * c.outputPrice) / 1_000_000;
  return { perRequest, perDay: perRequest * c.requestsPerDay, perMonth: perRequest * c.requestsPerDay * 30 };
}
