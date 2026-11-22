import type { ReactNode } from "react";
import { CheckBadge } from "@/components/ui/check-badge";
import { ActionButton } from "./controls";
import type { ExerciseResult } from "./types";

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

/** One orange line that fills as the student moves on: Loop'd is learning with her. */
function ProgressLine({ current, total }: { current: number; total: number }) {
  const share = total === 0 ? 0 : Math.min(1, current / total);
  return (
    <div aria-hidden className="h-3 overflow-hidden rounded-full bg-fill">
      <span
        className="block h-full rounded-full bg-brand-orange transition-[width] duration-400 ease-out"
        style={{ width: `${Math.max(share, 0.04) * 100}%` }}
      />
    </div>
  );
}

function EndScreen({ results, onExit }: { results: ExerciseResult[]; onExit: () => void }) {
  const passed = lemmasWhere(results, true);
  const failed = lemmasWhere(results, false);
  return (
    <div className="flex flex-col items-start gap-4">
      <CheckBadge size="lg" />
      <h2 className="text-[28px] font-bold tracking-[-0.01em] text-heading">Done</h2>
      {passed && <p className="animate-rise text-[17px] text-label">You got right: {passed}</p>}
      {failed && <p className="animate-rise text-[17px] text-label-secondary [--i:1]">To review again: {failed}</p>}
      <ActionButton onClick={onExit} className="mt-4">
        Back
      </ActionButton>
    </div>
  );
}

export function ExerciseShell({ title, current, total, onExit, results, children }: Props) {
  return (
    <section aria-label={title} className="flex flex-col gap-8">
      <ProgressLine current={results ? total : current} total={total} />
      {results ? <EndScreen results={results} onExit={onExit} /> : children}
    </section>
  );
}
