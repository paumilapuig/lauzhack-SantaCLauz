"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ActionButton, AnswerOption } from "./controls";
import { ExerciseShell } from "./exercise-shell";
import type { ExerciseProps, ExerciseResult, PracticeWord } from "./types";
import { makeTiles, spell, type Tile } from "./unscramble-logic";

type WordProps = { word: PracticeWord; seed: number; isLast: boolean; onDone: (passed: boolean) => void };

function WordRound({ word, seed, isLast, onDone }: WordProps) {
  const [tiles] = useState(() => makeTiles(word.lemma, seed));
  const [placed, setPlaced] = useState<Tile[]>([]);
  const complete = placed.length === tiles.length;
  const right = complete && spell(placed) === word.lemma;
  const used = new Set(placed.map((t) => t.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-medium text-subtle">Put the letters in order</p>
        <p lang="es" className="w-fit rounded-[10px] bg-word-yellow-bg px-3 py-1 text-[22px] font-bold text-word-yellow">
          {word.translation_es}
        </p>
      </div>
      <div
        data-testid="answer"
        lang="fr"
        className={cn(
          "flex min-h-16 items-center rounded-[16px] border-2 px-5 text-[28px] font-bold tracking-[0.04em] transition-colors",
          !complete && "border-dashed border-input text-heading",
          right && "animate-pop border-primary bg-primary-soft text-primary",
          complete && !right && "animate-nudge border-input text-subtle",
        )}
      >
        {spell(placed)}
      </div>
      {complete && !right && (
        <p className="text-[17px] text-label">
          It&apos;s spelled <strong lang="fr">{word.lemma}</strong>
        </p>
      )}
      <div lang="fr" className="flex flex-wrap gap-2">
        {tiles.map((tile) => (
          <AnswerOption
            key={tile.id}
            size="sm"
            state={used.has(tile.id) ? "done" : "idle"}
            disabled={used.has(tile.id) || complete}
            onClick={() => setPlaced([...placed, tile])}
          >
            {tile.char}
          </AnswerOption>
        ))}
      </div>
      <div className="flex gap-3">
        <ActionButton tone="soft" disabled={placed.length === 0} onClick={() => setPlaced(placed.slice(0, -1))}>
          Undo
        </ActionButton>
        {complete && (
          <ActionButton className="animate-pop" onClick={() => onDone(spell(placed) === word.lemma)}>
            {isLast ? "Finish" : "Next"}
          </ActionButton>
        )}
      </div>
    </div>
  );
}

export function Unscramble({ words, onFinish, onExit }: ExerciseProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [finished, setFinished] = useState(false);

  function handleDone(passed: boolean) {
    const next = [...results, { lemma: words[index].lemma, passed }];
    setResults(next);
    if (index + 1 < words.length) return setIndex(index + 1);
    setFinished(true);
    onFinish(next);
  }

  return (
    <ExerciseShell title="Letters" current={index} total={words.length} onExit={onExit} results={finished ? results : undefined}>
      <WordRound key={index} word={words[index]} seed={index + 1} isLast={index + 1 === words.length} onDone={handleDone} />
    </ExerciseShell>
  );
}
