export type DiffOp = { type: "same" | "add" | "del"; text: string };

/** Myers-free LCS diff; fine for prompts up to a few thousand units. */
export function diffSequences(a: string[], b: string[]): DiffOp[] {
  const n = a.length, m = b.length;
  if (n * m > 4_000_000) {
    return [...a.map((t) => ({ type: "del" as const, text: t })), ...b.map((t) => ({ type: "add" as const, text: t }))];
  }
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffOp[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ type: "same", text: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ type: "del", text: a[i++] });
    else out.push({ type: "add", text: b[j++] });
  }
  while (i < n) out.push({ type: "del", text: a[i++] });
  while (j < m) out.push({ type: "add", text: b[j++] });
  return out;
}

export const diffLines = (a: string, b: string) => diffSequences(a.split("\n"), b.split("\n"));
export const diffWords = (a: string, b: string) => diffSequences(a.split(/(\s+)/), b.split(/(\s+)/));
