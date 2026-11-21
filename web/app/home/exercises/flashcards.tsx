"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExerciseShell } from "./exercise-shell";
import { recordAnswer } from "./flashcards-logic";
import type { ExerciseProps, ExerciseResult } from "./types";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function Flashcards({ words, onFinish, onExit }: ExerciseProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [done, setDone] = useState(false);
  const word = words[index];

  function answer(knew: boolean) {
    const next = recordAnswer(results, word.lemma, knew);
    setResults(next);
    setFlipped(false);
    if (index + 1 < words.length) return setIndex(index + 1);
    setDone(true);
    onFinish(next);
  }

  return (
    <ExerciseShell title="Tarjetas" current={index} total={words.length} onExit={onExit} results={done ? results : undefined}>
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className={cn("flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl bg-fill px-6 text-center", FOCUS)}
        >
          <span lang="fr" className="text-[34px] font-semibold tracking-tight text-label">{word.lemma}</span>
          {flipped ? (
            <>
              <span lang="es" className="text-[21px] font-semibold text-word-yellow">{word.translation_es}</span>
              <span lang="fr" className="text-[17px] text-label-secondary">{word.definition_fr}</span>
            </>
          ) : (
            <span className="text-[15px] text-label-secondary">Toca para ver</span>
          )}
        </button>
        {flipped && (
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => answer(true)} className={cn("h-16 rounded-xl bg-fill text-[17px] font-semibold text-label", FOCUS)}>
              Lo sabía
            </button>
            <button type="button" onClick={() => answer(false)} className={cn("h-16 rounded-xl bg-fill text-[17px] font-semibold text-label", FOCUS)}>
              Aún no
            </button>
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
