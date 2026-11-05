import { describe, expect, it } from "vitest";
import { isPrivateAddress, normalizeUrl } from "@/lib/fetcher";

describe("SSRF guards", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"])("%s is private", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700::1111"])("%s is public", (ip) => expect(isPrivateAddress(ip)).toBe(false));
  it("normalizes bare hosts and rejects odd URLs", () => {
    expect(normalizeUrl("example.com").href).toBe("https://example.com/");
    expect(() => normalizeUrl("ftp://example.com")).toThrow();
    expect(() => normalizeUrl("http://user:pw@example.com")).toThrow();
    expect(() => normalizeUrl("http://example.com:8080")).toThrow();
  });
});
