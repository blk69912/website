import { ToolShell, toolMeta } from "@/components/ToolShell";
import { TraceTool } from "@/components/tools/TraceTool";
export const metadata = toolMeta("/tools/trace");
export default function Page() { return <ToolShell path="/tools/trace"><TraceTool /></ToolShell>; }
