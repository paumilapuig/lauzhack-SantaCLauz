"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { speak } from "../speech";
import { spellingMatches } from "./dictation-logic";
import { ExerciseShell } from "./exercise-shell";
import type { ExerciseProps, ExerciseResult } from "./types";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const PILL = cn("inline-flex h-11 w-fit items-center justify-center rounded-full px-6 text-[17px] font-semibold", FOCUS);
const SPEAK_RATE = 0.8;

export function Dictation({ words, onFinish, onExit }: ExerciseProps) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [done, setDone] = useState(false);
  const word = words[index];

  useEffect(() => {
    if (word) speak(word.lemma, SPEAK_RATE);
  }, [word]);

  const check = () => {
    setResults((r) => [...r, { lemma: word.lemma, passed: spellingMatches(typed, word.lemma) }]);
    setChecked(true);
  };

  const next = () => {
    if (index + 1 < words.length) {
      setIndex(index + 1);
      setTyped("");
      setChecked(false);
      return;
    }
    setDone(true);
    onFinish(results);
  };

  const passed = results[index]?.passed;

  return (
    <ExerciseShell title="Dictado" current={index} total={words.length} onExit={onExit} results={done ? results : undefined}>
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => speak(word.lemma, SPEAK_RATE)} className={cn(PILL, "bg-fill text-label")}>
          Escuchar otra vez
        </button>
        <label htmlFor="dictation-input" className="text-[17px] text-label-secondary">
          Escribe lo que oyes
        </label>
        <input
          id="dictation-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={checked}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          lang="fr"
          className={cn("h-11 rounded-xl bg-fill px-4 text-[17px] text-label", FOCUS)}
        />
        {checked && (
          <p className="text-[17px] text-label" aria-live="polite">
            {passed ? "¡Bien!" : "Se escribe:"} <strong>{word.lemma}</strong>
          </p>
        )}
        {checked ? (
          <button type="button" onClick={next} className={cn(PILL, "bg-primary text-primary-foreground")}>
            Siguiente
          </button>
        ) : (
          <button type="button" onClick={check} disabled={!typed.trim()} className={cn(PILL, "bg-primary text-primary-foreground disabled:opacity-40")}>
            Comprobar
          </button>
        )}
      </div>
    </ExerciseShell>
  );
}
