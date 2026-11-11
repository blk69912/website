"use client";
import { useState, type ReactNode } from "react";

export interface QuizItem { prompt: ReactNode; options: { value: string; label: string }[]; answer: string; why: string }

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function Quiz({ items, rounds, shareText }: { items: QuizItem[]; rounds: number; shareText: (score: number, total: number) => string }) {
  const [deck, setDeck] = useState<QuizItem[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const restart = () => { setDeck(shuffle(items).slice(0, rounds)); setI(0); setPicked(null); setScore(0); };

  if (!deck) {
    return (
      <div className="max-w-3xl">
        <p className="text-muted">{rounds} rounds, picked at random. Each answer comes with a short explanation.</p>
        <button className="btn mt-4 text-lg" onClick={restart}>Start</button>
      </div>
    );
  }

  if (i >= deck.length) {
    const text = shareText(score, deck.length);
    return (
      <div className="panel max-w-2xl p-6">
        <p className="text-5xl font-bold tabular-nums">{score} / {deck.length}</p>
        <p className="mt-3 text-muted">{score === deck.length ? "Perfect round." : score >= deck.length * 0.7 ? "Solid. Try again for a perfect round." : "Read the explanations and try another round."}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn" onClick={restart}>Play again</button>
          <a className="btn btn-quiet" href={`https://x.com/intent/post?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Share result</a>
        </div>
      </div>
    );
  }

  const q = deck[i];
  const done = picked !== null;
  return (
    <div className="max-w-3xl">
      <p className="text-sm text-muted">Round {i + 1} of {deck.length}. Score {score}.</p>
      <div className="mt-2">{q.prompt}</div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2" role="group" aria-label="Answers">
        {q.options.map((o) => {
          const right = o.value === q.answer;
          const state = !done ? "btn-quiet" : right ? "!bg-pass !border-pass !text-white !opacity-100" : picked === o.value ? "!bg-fail !border-fail !text-white !opacity-100" : "btn-quiet opacity-60";
          return (
            <button key={o.value} disabled={done} className={`btn ${state} justify-center py-3 text-lg`} onClick={() => { setPicked(o.value); if (right) setScore((s) => s + 1); }}>
              {o.label}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {done && (
          <div className="mt-5">
            <p className={`font-semibold ${picked === q.answer ? "status-pass" : "status-fail"}`}>{picked === q.answer ? "Correct." : "Not quite."}</p>
            <p className="prose-measure mt-1">{q.why}</p>
            <button className="btn mt-4" autoFocus onClick={() => { setI(i + 1); setPicked(null); }}>{i + 1 < deck.length ? "Next round" : "See score"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
