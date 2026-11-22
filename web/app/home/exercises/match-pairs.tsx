"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ExerciseShell } from "./exercise-shell";
import { buildBoard, buildResults, isPair } from "./match-pairs-logic";
import type { ExerciseProps, ExerciseResult } from "./types";

const FLASH_MS = 600;

type TileProps = { text: string; lang: string; selected: boolean; matched: boolean; wrong: boolean; onPick: () => void };

function Tile({ text, lang, selected, matched, wrong, onPick }: TileProps) {
  return (
    <button
      type="button"
      lang={lang}
      disabled={matched}
      onClick={onPick}
      className={cn(
        "h-16 rounded-xl bg-fill px-3 text-[17px] font-medium text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        lang === "es" && "text-word-yellow",
        selected && "ring-2 ring-primary",
        wrong && "ring-2 ring-destructive",
        matched && "opacity-30",
      )}
    >
      {text}
    </button>
  );
}

export function MatchPairs({ words, onFinish, onExit }: ExerciseProps) {
  const [board] = useState(() => buildBoard(words, Date.now()));
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const [results, setResults] = useState<ExerciseResult[]>();
  const lemmas = board.french.map((w) => w.lemma);

  useEffect(() => {
    if (wrong.length === 0) return;
    const timer = setTimeout(() => setWrong([]), FLASH_MS);
    return () => clearTimeout(timer);
  }, [wrong]);

  function pickSpanish(lemma: string) {
    if (selected === null) return;
    if (isPair(selected, lemma)) return acceptPair(lemma);
    setMissed(new Set(missed).add(selected).add(lemma));
    setWrong([selected, lemma]);
    setSelected(null);
  }

  function acceptPair(lemma: string) {
    const nextMatched = [...matched, lemma];
    setMatched(nextMatched);
    setSelected(null);
    if (nextMatched.length < lemmas.length) return;
    const finished = buildResults(lemmas, missed);
    setResults(finished);
    onFinish(finished);
  }

  const column = (items: typeof board.french, lang: string, pick: (lemma: string) => void) => (
    <div className="flex flex-1 flex-col gap-3">
      {items.map((w) => (
        <Tile
          key={w.lemma}
          lang={lang}
          text={lang === "fr" ? w.lemma : w.translation_es}
          selected={lang === "fr" && selected === w.lemma}
          matched={matched.includes(w.lemma)}
          wrong={wrong.includes(w.lemma)}
          onPick={() => pick(w.lemma)}
        />
      ))}
    </div>
  );

  return (
    <ExerciseShell title="Pairs" current={matched.length} total={lemmas.length} onExit={onExit} results={results}>
      <div className="flex gap-3">
        {column(board.french, "fr", setSelected)}
        {column(board.spanish, "es", pickSpanish)}
      </div>
    </ExerciseShell>
  );
}
