import Link from "next/link";
export default function NotFound() {
  return (
    <div className="max-w-2xl">
      <h1 className="page-title">No page here</h1>
      <p className="mt-3 text-lg text-muted">Check the address, or start from the <Link href="/">home page</Link>. Agents can read the full index at <a href="/llms.txt">/llms.txt</a>.</p>
    </div>
  );
}
