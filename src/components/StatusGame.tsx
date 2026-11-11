"use client";
import { useMemo } from "react";
import { STATUS_ROUNDS } from "@/content/games";
import { Quiz } from "./Quiz";

export function StatusGame() {
  const items = useMemo(() => STATUS_ROUNDS.map((r) => ({
    prompt: <p className="text-2xl font-semibold leading-snug">{r.situation}</p>,
    options: r.options.map((o) => ({ value: String(o), label: String(o) })),
    answer: String(r.answer),
    why: r.why,
  })), []);
  return <Quiz items={items} rounds={10} shareText={(s, t) => `I got ${s}/${t} on the HTTP status quiz.`} />;
}
