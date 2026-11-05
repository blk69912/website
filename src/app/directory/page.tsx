import type { Metadata } from "next";
import data from "../../../data/directory.generated.json";
import { DirectoryList, type DirEntry } from "@/components/DirectoryList";
import { pageFor, SITE } from "@/content/site";

const p = pageFor("/directory")!;
export const metadata: Metadata = { title: p.title, description: p.summary };

export default function Page() {
  return (
    <div className="max-w-5xl">
      <h1 className="page-title">{p.title}</h1>
      <p className="prose-measure mt-2 text-lg text-muted">{p.summary}</p>
      <p className="mt-1 text-sm text-muted">
        Stars synced from GitHub on {data.syncedAt.slice(0, 10)}. To add a project, send a pull request that adds one line to{" "}
        <a href={`${SITE.repo}/blob/main/data/directory.json`}>data/directory.json</a>.
      </p>
      <div className="mt-8">
        <DirectoryList entries={data.entries as DirEntry[]} />
      </div>
    </div>
  );
}
