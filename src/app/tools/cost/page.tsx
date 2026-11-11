import { ToolShell, toolMeta } from "@/components/ToolShell";
import { CostTool } from "@/components/tools/CostTool";
export const metadata = toolMeta("/tools/cost");
export default function Page() { return <ToolShell path="/tools/cost"><CostTool /></ToolShell>; }
