import { describe, expect, it } from "vitest";
import { isPrivateAddress, parseV6 } from "@/lib/ip";
import { badgeSvg, safeLabel } from "@/lib/badge";

describe("IPv6 parsing", () => {
  it("expands compressed and embedded forms", () => {
    expect(parseV6("::1")).toEqual([...Array(15).fill(0), 1]);
    expect(parseV6("::ffff:127.0.0.1")).toEqual(parseV6("::ffff:7f00:1"));
    expect(parseV6("2001:db8::1")?.slice(0, 4)).toEqual([0x20, 0x01, 0x0d, 0xb8]);
    expect(parseV6("1:2:3")).toBeNull();
    expect(parseV6("1::2::3")).toBeNull();
  });
});

describe("private address detection", () => {
  it.each([
    "127.0.0.1", "10.0.0.1", "169.254.169.254", "192.0.0.8",
    "::1", "::", "[::1]",
    "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:a9fe:a9fe", "0:0:0:0:0:ffff:7f00:0001",
    "::7f00:1", "::127.0.0.1",
    "64:ff9b::7f00:1", "64:ff9b::808:808",
    "2002:7f00:1::", "2002:a9fe:a9fe::1",
    "2001:0:4136:e378:8000:63bf:3fff:fdd2",
    "fc00::1", "fd12:3456::1", "fe80::1", "fec0::1", "ff02::1",
    "not-an-ip",
  ])("blocks %s", (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(["8.8.8.8", "2606:4700::1111", "::ffff:808:808", "2002:808:808::1", "2a00:1450:4001::200e"])("allows %s", (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );
});

describe("badge label", () => {
  it("strips characters that could break out of the SVG", () => {
    expect(safeLabel('x" onload="alert(1)')).toBe("x onloadalert1");
    expect(safeLabel("<script>")).toBe("script");
    expect(safeLabel("")).toBe("agent ready");
    expect(safeLabel(null)).toBe("agent ready");
  });
  it("escapes quotes even if a raw label reaches the renderer", () => {
    const svg = badgeSvg(`a"b'c`, "1", "#000");
    expect(svg).not.toContain(`a"b`);
    expect(svg).toContain("a&quot;b&#39;c");
  });
});
