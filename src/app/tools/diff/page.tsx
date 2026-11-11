import { ToolShell, toolMeta } from "@/components/ToolShell";
import { DiffTool } from "@/components/tools/DiffTool";
export const metadata = toolMeta("/tools/diff");
export default function Page() { return <ToolShell path="/tools/diff"><DiffTool /></ToolShell>; }
