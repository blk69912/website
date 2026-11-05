import { ToolShell, toolMeta } from "@/components/ToolShell";
import { SkillTool } from "@/components/tools/SkillTool";
export const metadata = toolMeta("/tools/skill");
export default function Page() { return <ToolShell path="/tools/skill"><SkillTool /></ToolShell>; }
