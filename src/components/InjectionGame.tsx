"use client";
import { useMemo } from "react";
import { INJECTION_ROUNDS } from "@/content/games";
import { Quiz } from "./Quiz";

export function InjectionGame() {
  const items = useMemo(() => INJECTION_ROUNDS.map((r) => ({
    prompt: (
      <div>
        <p className="text-muted">The agent is working on your task and receives this from <strong className="text-ink">{r.source}</strong>:</p>
        <pre className="code mt-3">{r.content}</pre>
      </div>
    ),
    options: [{ value: "data", label: "Ordinary data" }, { value: "inj", label: "Prompt injection" }],
    answer: r.injection ? "inj" : "data",
    why: r.why,
  })), []);
  return <Quiz items={items} rounds={8} shareText={(s, t) => `I spotted ${s}/${t} prompt injections correctly.`} />;
}
