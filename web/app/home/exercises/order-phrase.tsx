"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ActionButton, AnswerOption } from "./controls";
import { ExerciseShell } from "./exercise-shell";
import { isRebuilt, phraseChips, type Chip } from "./order-phrase-logic";
import { shuffle } from "./shuffle";
import type { ExerciseProps, ExerciseResult } from "./types";

export function OrderPhrase({ words: allWords, onFinish, onExit }: ExerciseProps) {
  const words = allWords.filter((w) => w.key_phrase.trim() !== "");
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<Chip[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
      setAttempt(attempt + 1);
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
    <ExerciseShell title="Order the sentence" current={index} total={words.length} onExit={onExit} results={done ? results : undefined}>
      <div className="flex flex-col gap-8">
        <p
          key={attempt}
          lang="fr"
          className={cn(
            "min-h-20 rounded-[16px] border-2 border-dashed border-input px-5 py-4 text-[24px] leading-snug font-bold tracking-[-0.01em] text-heading",
            attempt > 0 && placed.length === 0 && "animate-nudge",
          )}
        >
          {placed.map((chip) => chip.text).join(" ")}
        </p>
        <div lang="fr" className="flex flex-wrap gap-3">
          {remaining.map((chip, i) => (
            <AnswerOption key={chip.id} size="md" onClick={() => place(chip)} style={{ "--i": i } as React.CSSProperties} className="animate-pop">
              {chip.text}
            </AnswerOption>
          ))}
        </div>
        {failed && (
          <p role="status" className="w-fit rounded-[10px] bg-word-yellow-bg px-3 py-1 text-[16px] font-bold text-word-yellow">
            Try again
          </p>
        )}
        <ActionButton tone="soft" disabled={placed.length === 0} onClick={() => setPlaced(placed.slice(0, -1))} className="self-start">
          Undo
        </ActionButton>
      </div>
    </ExerciseShell>
  );
}
