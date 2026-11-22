"use client";

import { useMemo, useState } from "react";
import { ActionButton, AnswerOption, FeedbackBar, type OptionState } from "./controls";
import { ExerciseShell } from "./exercise-shell";
import { buildItems } from "./true-false-logic";
import type { ExerciseProps, ExerciseResult } from "./types";

const SEED = 1;

export function TrueFalse({ words, onFinish, onExit }: ExerciseProps) {
  const items = useMemo(() => buildItems(words, SEED), [words]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [said, setSaid] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const item = items[index];
  const correct = said === null ? null : said === item.isTrue;

  function answer(saidTrue: boolean) {
    if (said !== null) return;
    setSaid(saidTrue);
    setResults([...results, { lemma: item.lemma, passed: saidTrue === item.isTrue }]);
  }

  function next() {
    setSaid(null);
    if (index + 1 < items.length) return setIndex(index + 1);
    setDone(true);
    onFinish(results);
  }

  const stateOf = (value: boolean): OptionState => {
    if (said === null) return "idle";
    if (value === item.isTrue) return "correct";
    return value === said ? "wrong" : "done";
  };

  return (
    <ExerciseShell title="True or false?" current={index} total={items.length} onExit={onExit} results={done ? results : undefined}>
      <div className="flex flex-col gap-6">
        <div key={index} className="flex min-h-48 animate-rise flex-col items-center justify-center gap-3 rounded-[24px] border border-border bg-card px-6 text-center">
          <span lang="fr" className="text-[40px] leading-tight font-bold tracking-[-0.01em] text-heading">{item.lemma}</span>
          <span lang="fr" className="max-w-[28em] text-[19px] text-label">{item.definition}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AnswerOption state={stateOf(true)} disabled={said !== null} onClick={() => answer(true)}>True</AnswerOption>
          <AnswerOption state={stateOf(false)} disabled={said !== null} onClick={() => answer(false)}>False</AnswerOption>
        </div>
        {correct !== null && (
          <FeedbackBar
            correct={correct}
            title={correct ? "Well done!" : "Not quite"}
            detail={correct ? undefined : `It was ${item.isTrue ? "true" : "false"}.`}
            action={<ActionButton onClick={next}>Next</ActionButton>}
          />
        )}
      </div>
    </ExerciseShell>
  );
}
