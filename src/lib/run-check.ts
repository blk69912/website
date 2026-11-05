import "server-only";
import { cacheLife } from "next/cache";
import { analyze, draftLlmsTxt, type Analysis } from "./checker";
import { collectArtifacts, FetchError, normalizeUrl } from "./fetcher";

export type CheckOutcome = { ok: true; analysis: Analysis; llmsDraft: string; checkedAt: string } | { ok: false; error: string };

export async function runCheck(input: string): Promise<CheckOutcome> {
  let key: string;
  try {
    key = normalizeUrl(input).href;
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  return cachedCheck(key);
}

async function cachedCheck(url: string): Promise<CheckOutcome> {
  "use cache";
  cacheLife("minutes");
  try {
    const analysis = analyze(await collectArtifacts(url));
    return { ok: true, analysis, llmsDraft: draftLlmsTxt(analysis), checkedAt: new Date().toISOString() };
  } catch (e) {
    return { ok: false, error: e instanceof FetchError ? e.message : `The check failed: ${(e as Error).message}` };
  }
}
