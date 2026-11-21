"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ExerciseShell } from "./exercise-shell";
import { buildItems } from "./true-false-logic";
import type { ExerciseProps, ExerciseResult } from "./types";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const BIG_BUTTON = cn("h-16 rounded-xl bg-fill text-[17px] font-semibold text-label", FOCUS);
const SEED = 1;

export function TrueFalse({ words, onFinish, onExit }: ExerciseProps) {
  const items = useMemo(() => buildItems(words, SEED), [words]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const item = items[index];

  function answer(saidTrue: boolean) {
    const passed = saidTrue === item.isTrue;
    setCorrect(passed);
    setResults([...results, { lemma: item.lemma, passed }]);
  }

  function next() {
    setCorrect(null);
    if (index + 1 < items.length) return setIndex(index + 1);
    setDone(true);
    onFinish(results);
  }

  return (
    <ExerciseShell title="¿Verdadero o falso?" current={index} total={items.length} onExit={onExit} results={done ? results : undefined}>
      <div className="flex flex-col gap-6">
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl bg-fill px-6 text-center">
          <span lang="fr" className="text-[34px] font-semibold tracking-tight text-label">{item.lemma}</span>
          <span lang="fr" className="text-[17px] text-label-secondary">{item.definition}</span>
        </div>
        {correct === null ? (
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => answer(true)} className={BIG_BUTTON}>Verdadero</button>
            <button type="button" onClick={() => answer(false)} className={BIG_BUTTON}>Falso</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className={cn("text-[17px] font-semibold", correct ? "text-label" : "text-word-orange")}>
              {correct ? "¡Bien!" : "No era así"}
            </p>
            <button type="button" onClick={next} className={BIG_BUTTON}>Siguiente</button>
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
