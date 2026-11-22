import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { AnswerOption } from "./exercises/controls";

// Three thin segments, like a story progress bar
export function StepRail({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Steps" className="grid grid-cols-3 gap-1.5">
      {steps.map((title, i) => (
        <li key={title} aria-current={i === current ? "step" : undefined}>
          <span className={cn("block h-3 rounded-full transition-colors duration-400 ease-out", i <= current ? "bg-brand-orange" : "bg-fill")} />
          <span className="sr-only">{i < current ? `${title}, completado` : title}</span>
        </li>
      ))}
    </ol>
  );
}

export function StepPanel({ number, title, hint, children }: { number: number; title: string; hint: string; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) heading.current?.focus();
    firstRender.current = false;
  }, [number]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-[15px] font-bold text-heading tabular-nums">
          <span aria-hidden className="inline-flex size-7 items-center justify-center rounded-full bg-brand-orange text-[14px] text-white">{number}</span>
          Step {number} of 3
        </p>
        <h3 ref={heading} tabIndex={-1} className="text-balance text-[28px] font-bold tracking-[-0.01em] text-heading outline-none">
          {title}
        </h3>
        <p className="text-[17px] text-label-secondary">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export function OptionsStep({
  prompt,
  options,
  retry,
  onPick,
}: {
  prompt: ReactNode;
  options: string[];
  retry: boolean;
  onPick: (option: string) => void;
}) {
  const [wrong, setWrong] = useState<{ option: string; attempt: number } | null>(null);
  function choose(option: string) {
    setWrong({ option, attempt: (wrong?.attempt ?? 0) + 1 });
    onPick(option);
  }
  return (
    <>
      {prompt}
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const missed = retry && wrong?.option === option;
          return (
            <AnswerOption
              key={missed ? `${option}-${wrong?.attempt}` : option}
              lang="fr"
              state={missed ? "wrong" : "idle"}
              onClick={() => choose(option)}
            >
              {option}
            </AnswerOption>
          );
        })}
      </div>
      {retry && (
        <p role="status" className="w-fit rounded-[10px] bg-word-yellow-bg px-3 py-1 text-[17px] font-bold text-word-yellow">
          Almost. Try again.
        </p>
      )}
    </>
  );
}
