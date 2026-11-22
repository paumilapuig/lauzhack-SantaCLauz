"use client";

import { useEffect, useState } from "react";
import { AnswerOption, type OptionState } from "./controls";
import { ExerciseShell } from "./exercise-shell";
import { buildBoard, buildResults, isPair } from "./match-pairs-logic";
import type { ExerciseProps, ExerciseResult } from "./types";

const FLASH_MS = 600;

type TileProps = { text: string; lang: string; state: OptionState; onPick: () => void };

function Tile({ text, lang, state, onPick }: TileProps) {
  return (
    <AnswerOption size="md" lang={lang} state={state} disabled={state === "correct"} onClick={onPick} className="w-full">
      {text}
    </AnswerOption>
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

  const stateOf = (lemma: string, french: boolean): OptionState => {
    if (matched.includes(lemma)) return "correct";
    if (wrong.includes(lemma)) return "wrong";
    return french && selected === lemma ? "selected" : "idle";
  };

  const column = (items: typeof board.french, lang: string, pick: (lemma: string) => void) => (
    <div className="flex flex-1 flex-col gap-3">
      {items.map((w, i) => (
        <div key={w.lemma} style={{ "--i": i } as React.CSSProperties} className="animate-rise">
          <Tile
            lang={lang}
            text={lang === "fr" ? w.lemma : w.translation_es}
            state={stateOf(w.lemma, lang === "fr")}
            onPick={() => pick(w.lemma)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <ExerciseShell title="Pairs" current={matched.length} total={lemmas.length} onExit={onExit} results={results}>
      <p className="-mt-2 text-[17px] text-label-secondary">Tap a French word, then its Spanish pair.</p>
      <div className="flex gap-3">
        {column(board.french, "fr", setSelected)}
        {column(board.spanish, "es", pickSpanish)}
      </div>
    </ExerciseShell>
  );
}
