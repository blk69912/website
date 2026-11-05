import type { Metadata } from "next";
import { StatusGame } from "@/components/StatusGame";
import { pageFor } from "@/content/site";
const p = pageFor("/play/status")!;
export const metadata: Metadata = { title: p.title, description: p.summary };
export default function Page() {
  return (<div><h1 className="page-title mb-8">{p.title}</h1><StatusGame /></div>);
}
