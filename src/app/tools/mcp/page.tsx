import { ToolShell, toolMeta } from "@/components/ToolShell";
import { McpTool } from "@/components/tools/McpTool";
export const metadata = toolMeta("/tools/mcp");
export default function Page() { return <ToolShell path="/tools/mcp"><McpTool /></ToolShell>; }
