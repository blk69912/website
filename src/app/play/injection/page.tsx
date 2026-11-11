import type { Metadata } from "next";
import { InjectionGame } from "@/components/InjectionGame";
import { pageFor } from "@/content/site";
const p = pageFor("/play/injection")!;
export const metadata: Metadata = { title: p.title, description: p.summary };
export default function Page() {
  return (
    <div>
      <h1 className="page-title">{p.title}</h1>
      <p className="prose-measure mb-8 mt-2 text-lg text-muted">Agents read web pages, files, and emails while they work. Some of that text tries to give orders. Can you tell which?</p>
      <InjectionGame />
    </div>
  );
}
