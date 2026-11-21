"use client";

import { useState } from "react";
import { PracticeFlow } from "../practice-flow";
import { ExerciseShell } from "./exercise-shell";
import type { ExerciseProps } from "./types";

// PracticeFlow already saves each word, so finishing reports no results.
export function StepByStep({ words, onFinish, onExit }: ExerciseProps) {
  const [index, setIndex] = useState(0);
  const word = words[index];

  function next() {
    if (index + 1 >= words.length) onFinish([]);
    else setIndex(index + 1);
  }

  return (
    <ExerciseShell title="Paso a paso" current={index} total={words.length} onExit={onExit}>
      <PracticeFlow key={word.lemma} word={{ ...word, level: 0, clip_id: null }} onDone={next} onExit={onExit} />
    </ExerciseShell>
  );
}
