// shields.io-style flat badge, measured with an approximate Verdana width table.
const W: Record<string, number> = { " ": 3.6, i: 3, l: 3, ".": 3.6, "/": 4.4, "1": 6.4, f: 4.2, t: 4.4, r: 4.8, j: 3.4 };
const width = (s: string) => [...s].reduce((n, ch) => n + (W[ch] ?? (/[A-Z]/.test(ch) ? 7.4 : 6.4)), 0);

export function badgeColor(score: number | null): string {
  if (score === null) return "#9aa3ad";
  if (score >= 90) return "#1f7a4d";
  if (score >= 75) return "#3b8f2f";
  if (score >= 60) return "#a77d00";
  if (score >= 40) return "#c25a12";
  return "#b4232c";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function badgeSvg(label: string, value: string, color: string): string {
  const lw = Math.round(width(label) + 12);
  const vw = Math.round(width(value) + 12);
  const total = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${esc(label)}: ${esc(value)}"><title>${esc(label)}: ${esc(value)}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#3a4350"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/><rect width="${total}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"><text x="${lw / 2}" y="14">${esc(label)}</text><text x="${lw + vw / 2}" y="14">${esc(value)}</text></g></svg>`;
}
