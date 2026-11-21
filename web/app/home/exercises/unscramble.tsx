"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExerciseShell } from "./exercise-shell";
import type { ExerciseProps, ExerciseResult, PracticeWord } from "./types";
import { makeTiles, spell, type Tile } from "./unscramble-logic";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const PILL = "inline-flex h-11 items-center justify-center rounded-full px-6 text-[17px] font-semibold";

type WordProps = { word: PracticeWord; seed: number; isLast: boolean; onDone: (passed: boolean) => void };

function WordRound({ word, seed, isLast, onDone }: WordProps) {
  const [tiles] = useState(() => makeTiles(word.lemma, seed));
  const [placed, setPlaced] = useState<Tile[]>([]);
  const complete = placed.length === tiles.length;
  const used = new Set(placed.map((t) => t.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] text-label-secondary">Ordena las letras</p>
        <p className="text-[21px] font-semibold text-label">{word.translation_es}</p>
      </div>
      <div data-testid="answer" lang="fr" className="flex min-h-12 flex-wrap gap-2 border-b border-border pb-2 text-[21px] font-semibold text-label">
        {spell(placed)}
      </div>
      <div lang="fr" className="flex flex-wrap gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            disabled={used.has(tile.id) || complete}
            onClick={() => setPlaced([...placed, tile])}
            className={cn("size-12 rounded-xl bg-fill text-[21px] font-semibold text-label disabled:opacity-30", FOCUS)}
          >
            {tile.char}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button type="button" disabled={placed.length === 0} onClick={() => setPlaced(placed.slice(0, -1))} className={cn(PILL, "bg-fill text-label disabled:opacity-30", FOCUS)}>
          Deshacer
        </button>
        {complete && (
          <button type="button" onClick={() => onDone(spell(placed) === word.lemma)} className={cn(PILL, "bg-primary text-primary-foreground", FOCUS)}>
            {isLast ? "Terminar" : "Siguiente"}
          </button>
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
    <ExerciseShell title="Letras" current={index} total={words.length} onExit={onExit} results={finished ? results : undefined}>
      <WordRound key={index} word={words[index]} seed={index + 1} isLast={index + 1 === words.length} onDone={handleDone} />
    </ExerciseShell>
  );
}
