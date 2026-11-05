import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { Artifacts } from "./checker";

const UA = "AgentReadyChecker/1.0 (+https://github.com/blk69912/website)";
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;

export class FetchError extends Error {}

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v);
}

export function normalizeUrl(input: string): URL {
  let s = input.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new FetchError("That is not a valid URL. Try something like example.com.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new FetchError("Only http and https URLs can be checked.");
  if (u.username || u.password) throw new FetchError("URLs with credentials are not accepted.");
  if (u.port && !["80", "443", ""].includes(u.port)) throw new FetchError("Only the default ports 80 and 443 can be checked.");
  u.hash = "";
  return u;
}

async function assertPublicHost(u: URL) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local"))
    throw new FetchError("Private hosts cannot be checked.");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => {
    throw new FetchError(`Could not resolve ${host}. Check the spelling.`);
  });
  if (addrs.some((a) => isPrivateAddress(a.address))) throw new FetchError("Private or internal addresses cannot be checked.");
}

export interface SafeResponse {
  url: string;
  status: number;
  contentType: string;
  body: string;
}

/** GET with manual redirects, so every hop is re-validated against private ranges. */
export async function safeGet(input: URL, accept = "text/html,*/*;q=0.8", hops = 4): Promise<SafeResponse> {
  let u = input;
  for (let i = 0; i <= hops; i++) {
    await assertPublicHost(u);
    const res = await fetch(u, {
      redirect: "manual",
      headers: { "user-agent": UA, accept },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      u = normalizeUrl(new URL(res.headers.get("location")!, u).href);
      continue;
    }
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const body = new TextDecoder().decode(Buffer.concat(chunks));
    return { url: u.href, status: res.status, contentType: res.headers.get("content-type") ?? "", body };
  }
  throw new FetchError("Too many redirects.");
}

const optional = async (u: URL, accept?: string) => {
  try {
    const r = await safeGet(u, accept);
    return r.status >= 200 && r.status < 300 ? r : null;
  } catch {
    return null;
  }
};

export async function collectArtifacts(input: string): Promise<Artifacts> {
  const url = normalizeUrl(input);
  let page: SafeResponse;
  try {
    page = await safeGet(url);
  } catch (e) {
    if (e instanceof FetchError) throw e;
    throw new FetchError(`Could not fetch ${url.hostname}: ${(e as Error).message}`);
  }
  const origin = new URL(page.url).origin;
  const [robots, llms, md, sitemap] = await Promise.all([
    optional(new URL("/robots.txt", origin), "text/plain"),
    optional(new URL("/llms.txt", origin), "text/markdown,text/plain"),
    optional(new URL(page.url), "text/markdown"),
    optional(new URL("/sitemap.xml", origin), "application/xml"),
  ]);
  const robotsTxt = robots && !/text\/html/i.test(robots.contentType) ? robots.body : null;
  return {
    url: page.url,
    status: page.status,
    contentType: page.contentType,
    html: page.body,
    robotsTxt,
    llmsTxt: llms?.body ?? null,
    llmsTxtContentType: llms?.contentType,
    sitemapFound: !!(sitemap && /<(urlset|sitemapindex)/i.test(sitemap.body)) || /^\s*sitemap\s*:/im.test(robotsTxt ?? ""),
    markdownNegotiated: !!md && /text\/(markdown|x-markdown)/i.test(md.contentType),
  };
}
