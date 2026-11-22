"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { speak } from "../speech";
import { ActionButton, FeedbackBar, PRESS } from "./controls";
import { spellingMatches } from "./dictation-logic";
import { ExerciseShell } from "./exercise-shell";
import type { ExerciseProps, ExerciseResult } from "./types";

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
    <ExerciseShell title="Dictation" current={index} total={words.length} onExit={onExit} results={done ? results : undefined}>
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!checked && typed.trim()) check();
        }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => speak(word.lemma, SPEAK_RATE)}
            aria-label="Listen again"
            className={cn("flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white hover:bg-brand-orange/90", PRESS)}
          >
            <Volume2 aria-hidden className="size-7" />
          </button>
          <label htmlFor="dictation-input" className="text-[19px] font-bold text-heading">
            Write what you hear
          </label>
        </div>
        <input
          id="dictation-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={checked}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          lang="fr"
          className={cn(
            "h-16 rounded-[16px] border-2 bg-card px-5 text-[22px] font-bold text-heading transition-colors outline-none focus:border-heading",
            checked ? (passed ? "border-primary bg-primary-soft text-primary" : "border-input text-subtle") : "border-input",
          )}
        />
        {checked ? (
          <FeedbackBar
            correct={passed}
            title={passed ? "Well done!" : "It's spelled:"}
            detail={<strong lang="fr" className="text-[19px]">{word.lemma}</strong>}
            action={<ActionButton onClick={next}>Next</ActionButton>}
          />
        ) : (
          <ActionButton type="submit" disabled={!typed.trim()} className="self-start">
            Check
          </ActionButton>
        )}
      </form>
    </ExerciseShell>
  );
}
