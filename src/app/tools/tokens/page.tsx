import { ToolShell, toolMeta } from "@/components/ToolShell";
import { TokenTool } from "@/components/tools/TokenTool";
export const metadata = toolMeta("/tools/tokens");
export default function Page() { return <ToolShell path="/tools/tokens"><TokenTool /></ToolShell>; }
