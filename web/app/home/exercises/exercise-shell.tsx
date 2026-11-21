import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ExerciseResult } from "./types";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type Props = {
  title: string;
  current: number;
  total: number;
  onExit: () => void;
  results?: ExerciseResult[];
  children: ReactNode;
};

function lemmasWhere(results: ExerciseResult[], passed: boolean) {
  return results.filter((r) => r.passed === passed).map((r) => r.lemma).join(", ");
}

function ProgressSegments({ current, total }: { current: number; total: number }) {
  return (
    <div aria-hidden className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= current ? "bg-primary" : "bg-fill-strong")} />
      ))}
    </div>
  );
}

function EndScreen({ results, onExit }: { results: ExerciseResult[]; onExit: () => void }) {
  const passed = lemmasWhere(results, true);
  const failed = lemmasWhere(results, false);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[28px] font-semibold tracking-tight text-label">Hecho</h2>
      {passed && <p className="text-[17px] text-label">Sube de nivel: {passed}</p>}
      {failed && <p className="text-[17px] text-label-secondary">Para repasar otra vez: {failed}</p>}
      <button
        type="button"
        onClick={onExit}
        className={cn("mt-4 inline-flex h-11 w-fit items-center justify-center rounded-full bg-primary px-6 text-[17px] font-semibold text-primary-foreground", FOCUS)}
      >
        Volver
      </button>
    </div>
  );
}

export function ExerciseShell({ title, current, total, onExit, results, children }: Props) {
  return (
    <section aria-label={title} className="flex flex-col gap-8">
      <ProgressSegments current={results ? total : current} total={total} />
      {results ? <EndScreen results={results} onExit={onExit} /> : children}
    </section>
  );
}
