import { isIP } from "node:net";

// Address classification for SSRF protection. IPv6 is parsed into bytes so that
// every spelling of an embedded IPv4 address is caught.

function v4Private([a, b]: number[]): boolean {
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

export function parseV6(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  // Rewrite a trailing dotted IPv4 (e.g. ::ffff:127.0.0.1) as two hex words.
  const v4 = s.match(/^(.*:)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const p = v4.slice(2).map(Number);
    if (p.some((x) => x > 255)) return null;
    s = `${v4[1]}${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const words = (h: string) => (h ? h.split(":") : []);
  const head = words(halves[0]);
  const rest = halves.length === 2 ? words(halves[1]) : [];
  const fill = 8 - head.length - rest.length;
  if (halves.length === 1 ? fill !== 0 : fill < 1) return null;
  const all = [...head, ...Array(halves.length === 2 ? fill : 0).fill("0"), ...rest];
  if (all.some((w) => !/^[0-9a-f]{1,4}$/.test(w))) return null;
  return all.map((w) => parseInt(w, 16)).flatMap((w) => [w >> 8, w & 0xff]);
}

export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip.replace(/^\[|\]$/g, ""));
  if (kind === 4) return v4Private(ip.split(".").map(Number));
  if (kind !== 6) return true; // unknown format: refuse
  const b = parseV6(ip);
  if (!b) return true;
  const zero = (from: number, to: number) => b.slice(from, to).every((x) => x === 0);
  const v4At = (i: number) => b.slice(i, i + 4);
  if (zero(0, 16)) return true; // ::
  if (zero(0, 15) && b[15] === 1) return true; // ::1
  if (zero(0, 10) && b[10] === 0xff && b[11] === 0xff) return v4Private(v4At(12)); // ::ffff:0:0/96 mapped
  if (zero(0, 12)) return true; // ::/96 IPv4-compatible (deprecated)
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b) return true; // 64:ff9b::/96 NAT64 and 64:ff9b:1::/48
  if (b[0] === 0x20 && b[1] === 0x02) return v4Private(v4At(2)); // 2002::/16 6to4
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x00) return true; // 2001::/32 Teredo
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return true; // 2001:db8::/32 documentation
  if ((b[0] & 0xfe) === 0xfc) return true; // fc00::/7 unique local
  if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return true; // fe80::/10 link local
  if (b[0] === 0xfe && (b[1] & 0xc0) === 0xc0) return true; // fec0::/10 site local
  if (b[0] === 0xff) return true; // multicast
  return false;
}
