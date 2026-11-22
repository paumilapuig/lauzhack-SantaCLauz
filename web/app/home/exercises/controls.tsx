import type { ButtonHTMLAttributes, ReactNode } from "react";
import { CheckBadge } from "@/components/ui/check-badge";
import { cn } from "@/lib/utils";

/** Pressed = scale 0.96; focus ring in teal; no motion when the user asks for less. */
export const PRESS =
  "touch-manipulation select-none transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "done";

const OPTION: Record<OptionState, string> = {
  idle: "border-input bg-card text-heading hover:border-input-hover hover:bg-fill",
  selected: "border-heading bg-card text-heading",
  correct: "border-primary bg-primary-soft text-primary",
  wrong: "animate-nudge border-input bg-card text-subtle",
  done: "border-border bg-fill text-subtle",
};

type OptionProps = ButtonHTMLAttributes<HTMLButtonElement> & { state?: OptionState; size?: "lg" | "md" | "sm"; children: ReactNode };

const OPTION_SIZE = {
  lg: "min-h-14 px-5 text-[20px] md:min-h-24 md:text-[24px]",
  md: "min-h-14 px-4 text-[18px] md:min-h-16 md:text-[20px]",
  sm: "size-14 text-[22px]",
};

/** A game answer: 2 px border, radius 16; correct → teal with a check on the right. */
export function AnswerOption({ state = "idle", size = "lg", className, children, ...props }: OptionProps) {
  return (
    <button
      type="button"
      data-state={state}
      {...props}
      className={cn(
        "relative inline-flex items-center justify-center rounded-[16px] border-2 font-bold tracking-[-0.01em] disabled:cursor-default",
        PRESS,
        OPTION[state],
        OPTION_SIZE[size],
        className,
      )}
    >
      {children}
      {state === "correct" && size !== "sm" && <CheckBadge size="sm" className="absolute right-4" />}
    </button>
  );
}

const ACTION = {
  ink: "bg-heading text-primary-foreground hover:bg-heading/90",
  teal: "bg-primary text-primary-foreground hover:bg-primary/90",
  soft: "border-2 border-input bg-card text-heading hover:border-input-hover hover:bg-fill",
};

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof ACTION; children: ReactNode };

/** Check / Next / Listen again: full pill, 56 px, bold. */
export function ActionButton({ tone = "ink", className, children, ...props }: ActionProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-[17px] font-bold disabled:pointer-events-none disabled:opacity-40",
        PRESS,
        ACTION[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

type FeedbackProps = { correct: boolean; title: string; detail?: ReactNode; action: ReactNode };

/** After an answer: teal when right, yellow help when not — always with the way forward. */
export function FeedbackBar({ correct, title, detail, action }: FeedbackProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex animate-rise flex-col gap-4 rounded-[16px] p-5 sm:flex-row sm:items-center sm:justify-between",
        correct ? "bg-primary-soft" : "bg-word-yellow-bg",
      )}
    >
      <div className="flex items-center gap-3">
        {correct && <CheckBadge size="md" />}
        <div className="flex flex-col">
          <p className={cn("text-[19px] font-bold", correct ? "text-primary" : "text-word-yellow")}>{title}</p>
          {detail && <p className="text-[16px] text-label">{detail}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
