"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ExerciseShell } from "./exercise-shell";
import { isRebuilt, phraseChips, type Chip } from "./order-phrase-logic";
import { shuffle } from "./shuffle";
import type { ExerciseProps, ExerciseResult } from "./types";

const CHIP = "h-11 rounded-full bg-fill px-4 text-[17px] text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function OrderPhrase({ words: allWords, onFinish, onExit }: ExerciseProps) {
  const words = allWords.filter((w) => w.key_phrase.trim() !== "");
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<Chip[]>([]);
  const [failed, setFailed] = useState(false);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [done, setDone] = useState(false);
  const word = words[index];
  const chips = useMemo(() => phraseChips(word.key_phrase), [word]);
  const pool = useMemo(() => shuffle(chips, index + 1), [chips, index]);
  const remaining = pool.filter((chip) => !placed.includes(chip));

  function place(chip: Chip) {
    const next = [...placed, chip];
    if (next.length < chips.length) return setPlaced(next);
    if (!isRebuilt(chips, next)) {
      setFailed(true);
      return setPlaced([]);
    }
    const all = [...results, { lemma: word.lemma, passed: !failed }];
    setResults(all);
    setPlaced([]);
    setFailed(false);
    if (index + 1 < words.length) return setIndex(index + 1);
    setDone(true);
    onFinish(all);
  }

  return (
    <ExerciseShell title="Ordena la frase" current={index} total={words.length} onExit={onExit} results={done ? results : undefined}>
      <div className="flex flex-col gap-8">
        <p lang="fr" className="min-h-14 border-b border-separator pb-3 text-[24px] font-semibold tracking-tight text-label">
          {placed.map((chip) => chip.text).join(" ")}
        </p>
        <div lang="fr" className="flex flex-wrap gap-3">
          {remaining.map((chip) => (
            <button key={chip.id} type="button" onClick={() => place(chip)} className={cn(CHIP)}>
              {chip.text}
            </button>
          ))}
        </div>
        {failed && <p className="text-[15px] text-label-secondary">Prueba otra vez</p>}
        <button
          type="button"
          disabled={placed.length === 0}
          onClick={() => setPlaced(placed.slice(0, -1))}
          className={cn(CHIP, "self-start text-[15px] disabled:opacity-40")}
        >
          Deshacer
        </button>
      </div>
    </ExerciseShell>
  );
}
