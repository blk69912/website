import { ImageResponse } from "next/og";
import { SITE } from "@/content/site";

export const alt = `${SITE.name}: tools for the agent-readable web`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#eef1f4", fontFamily: "sans-serif" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 72 }}>
          <div style={{ fontSize: 34, color: "#2346d8", fontWeight: 700 }}>{SITE.name}</div>
          <div style={{ fontSize: 68, color: "#18212c", fontWeight: 700, lineHeight: 1.05, marginTop: 20 }}>Is your site readable by AI agents?</div>
          <div style={{ fontSize: 28, color: "#566170", marginTop: 28 }}>Checker, badge, and open-source tools for agent builders.</div>
        </div>
        <div style={{ width: 380, background: "#1c2733", color: "#d9e1ea", display: "flex", flexDirection: "column", padding: 44, fontSize: 24, fontFamily: "monospace", justifyContent: "center" }}>
          <div style={{ color: "#9fb0c2" }}>Accept: text/markdown</div>
          <div style={{ marginTop: 24 }}># Agent Ready</div>
          <div style={{ marginTop: 12 }}>&gt; Tools for building</div>
          <div>&gt; a web that people</div>
          <div>&gt; and agents can both</div>
          <div>&gt; read.</div>
        </div>
      </div>
    ),
    size,
  );
}
