"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnswerOption, PRESS } from "./controls";
import { ExerciseShell } from "./exercise-shell";
import { recordAnswer } from "./flashcards-logic";
import type { ExerciseProps, ExerciseResult } from "./types";

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
    <ExerciseShell title="Flashcards" current={index} total={words.length} onExit={onExit} results={done ? results : undefined}>
      <div className="flex flex-col gap-6">
        <button
          key={index}
          type="button"
          onClick={() => setFlipped(true)}
          aria-expanded={flipped}
          className={cn(
            "flex min-h-64 animate-rise flex-col items-center justify-center gap-3 rounded-[24px] border-2 bg-card px-6 text-center",
            flipped ? "border-brand-orange" : "border-input hover:border-input-hover",
            PRESS,
          )}
        >
          <span lang="fr" className="text-[40px] leading-tight font-bold tracking-[-0.01em] text-heading md:text-[52px]">
            {word.lemma}
          </span>
          {flipped ? (
            <span className="flex animate-pop flex-col items-center gap-2">
              <span lang="es" className="rounded-[10px] bg-word-yellow-bg px-3 py-1 text-[22px] font-bold text-word-yellow">
                {word.translation_es}
              </span>
              {word.definition_fr && <span lang="fr" className="max-w-[28em] text-[17px] text-label-secondary">{word.definition_fr}</span>}
            </span>
          ) : (
            <span className="text-[15px] font-medium text-subtle">Tap to see</span>
          )}
        </button>
        {flipped && (
          <div className="grid animate-rise gap-3 sm:grid-cols-2">
            <AnswerOption onClick={() => answer(false)}>Not yet</AnswerOption>
            <AnswerOption onClick={() => answer(true)} className="hover:border-primary hover:bg-primary-soft hover:text-primary">
              I knew it
            </AnswerOption>
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
