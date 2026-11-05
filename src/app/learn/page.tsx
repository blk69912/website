import type { Metadata } from "next";
import { Learn } from "@/components/Learn";
import { pageFor } from "@/content/site";

const p = pageFor("/learn")!;
export const metadata: Metadata = { title: p.title, description: p.summary };

export default function Page() {
  return <Learn />;
}
