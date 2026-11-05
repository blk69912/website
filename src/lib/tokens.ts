// Heuristic token estimate. Real counts depend on the model's tokenizer;
// use the provider's count-tokens endpoint when you need an exact number.

export interface TokenEstimate {
  tokens: number;
  chars: number;
  words: number;
  lines: number;
  cjk: number;
}

const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯＀-￯]/g;

export function estimateTokens(text: string): TokenEstimate {
  const cjk = (text.match(CJK) ?? []).length;
  const rest = text.replace(CJK, " ");
  const words = rest.split(/\s+/).filter(Boolean);
  let latin = 0;
  for (const w of words) {
    // Punctuation and digits split often; long words split into ~4-char pieces.
    const punct = (w.match(/[^\p{L}\p{N}]/gu) ?? []).length;
    const core = w.length - punct;
    latin += Math.max(core > 0 ? 1 : 0, Math.ceil(core / 4.2)) + punct * 0.7;
  }
  return {
    tokens: Math.round(latin + cjk * 1.1),
    chars: [...text].length,
    words: words.length + cjk,
    lines: text ? text.split("\n").length : 0,
    cjk,
  };
}
