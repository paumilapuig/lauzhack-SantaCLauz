import type { ExerciseResult } from "./types";

export function recordAnswer(results: ExerciseResult[], lemma: string, knew: boolean): ExerciseResult[] {
  return [...results, { lemma, passed: knew }];
}
