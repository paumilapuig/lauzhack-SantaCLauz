import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "cn";

// Three thin segments, like a story progress bar
export function StepRail({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Pasos" className="grid grid-cols-3 gap-1.5">
      {steps.map((title, i) => (
        <li key={title} aria-current={i === current ? "step" : undefined}>
          <span className={cn("block h-1 rounded-full transition-colors", i <= current ? "bg-primary" : "bg-fill-strong")} />
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
        <p className="text-[15px] font-medium text-label-secondary tabular-nums">Paso {number} de 3</p>
        <h3 ref={heading} tabIndex={-1} className="text-balance text-[28px] font-semibold tracking-[-0.02em]">
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
  return (
    <>
      {prompt}
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            lang="fr"
            onClick={() => onPick(option)}
            className="h-16 touch-manipulation rounded-xl bg-fill px-4 text-[21px] font-semibold tracking-[-0.01em] transition-[background-color,transform] hover:bg-fill-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {option}
          </button>
        ))}
      </div>
      {retry && (
        <p role="status" className="text-[17px] text-word-orange">
          Casi. Prueba otra vez.
        </p>
      )}
    </>
  );
}
