import { describe, expect, it, vi } from "vitest";

// Simulate DNS rebinding: the pre-check resolver sees a public address,
// but the resolver used at connect time returns loopback.
vi.mock("node:dns/promises", () => ({ lookup: async () => [{ address: "93.184.215.14", family: 4 }] }));

describe("connect-time address guard", () => {
  it("refuses to connect when the connect-time answer is private", async () => {
    const { safeGet, normalizeUrl } = await import("@/lib/fetcher");
    // localtest.me resolves to 127.0.0.1 in real DNS.
    await expect(safeGet(normalizeUrl("http://localtest.me/"))).rejects.toThrow(/Private or internal/);
  });
});
