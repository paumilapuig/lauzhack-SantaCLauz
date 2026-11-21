import { Check, Lightbulb } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "cn";

export function StepRail({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Pasos" className="flex items-center gap-2">
      {steps.map((title, i) => {
        const done = i < current;
        return (
          <li key={title} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              aria-current={i === current ? "step" : undefined}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full font-mono text-base font-bold transition-colors",
                done && "bg-primary text-primary-foreground",
                i === current && "bg-card text-primary ring-2 ring-primary",
                i > current && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check aria-hidden className="size-5" /> : i + 1}
              <span className="sr-only">{done ? `${title}, completado` : title}</span>
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className={cn("h-0.5 flex-1 rounded-full", done ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 ref={heading} tabIndex={-1} className="text-2xl font-bold outline-none">
          {number}. {title}
        </h3>
        <p className="text-lg text-muted-foreground">{hint}</p>
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
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            lang="fr"
            onClick={() => onPick(option)}
            className="min-h-20 rounded-2xl border-2 border-border bg-card px-4 text-2xl font-bold transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {option}
          </button>
        ))}
      </div>
      {retry && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-marker/40 px-4 py-3 text-lg">
          <Lightbulb aria-hidden className="size-5 text-word-yellow" />
          Casi. Prueba otra vez.
        </p>
      )}
    </>
  );
}
