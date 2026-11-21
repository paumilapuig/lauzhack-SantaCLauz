export type PracticeWord = { lemma: string; translation_es: string; definition_fr: string; key_phrase: string };

export type ExerciseResult = { lemma: string; passed: boolean };

export type ExerciseProps = {
  words: PracticeWord[];
  onFinish: (results: ExerciseResult[]) => void;
  onExit: () => void;
};
