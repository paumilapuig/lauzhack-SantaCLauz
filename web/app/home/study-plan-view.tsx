import { ArrowRight, Clock } from "lucide-react"
import type { ReactNode } from "react"
import { CheckBadge } from "@/components/ui/check-badge"
import { StepChip } from "@/components/ui/step-chip"
import { cn } from "@/lib/utils"
import { PRESS } from "./exercises/controls"
import type { PracticeModeItem } from "./practice-modes-list"
import { planMinutes, type PlanEntry } from "./study-plan"

type Props = {
  steps: PlanEntry[]
  modes: PracticeModeItem[]
  onClips: () => void
  onConcept: (id: string) => void
  onPractice: (modeId: string) => void
}

type Row = { title: ReactNode; why: ReactNode; minutes: number; onStart: () => void }

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

function rowFor(step: PlanEntry, props: Props): Row {
  if (step.kind === "clips")
    return {
      title: step.done ? "Listen again to your clips" : `Listen again to ${plural(step.count, "clip")}`,
      why: "Tap the words you missed. They become your games.",
      minutes: step.minutes,
      onStart: props.onClips,
    }
  if (step.kind === "concept")
    return {
      title: (
        <>
          Understand <span lang="fr">«&nbsp;{step.concept}&nbsp;»</span>
        </>
      ),
      why: `A short explanation, then ${plural(step.questions, "question")}.`,
      minutes: step.minutes,
      onStart: () => props.onConcept(step.id),
    }
  const mode = props.modes.find((m) => m.id === step.modeId)
  return {
    title: `Practise with ${mode?.name ?? "a game"}`,
    why: (
      <span className="flex flex-wrap gap-1.5">
        {step.words.map((w) => (
          <span key={w.lemma} className="inline-flex items-baseline gap-1.5 rounded-[10px] bg-word-yellow-bg px-2 py-0.5 text-[14px]">
            <span lang="fr" className="font-bold text-heading">{w.lemma}</span>
            {w.translation && <span lang="es" className="text-word-yellow">{w.translation}</span>}
          </span>
        ))}
      </span>
    ),
    minutes: step.minutes,
    onStart: () => props.onPractice(step.modeId),
  }
}

function AllDone() {
  return (
    <div className="flex animate-rise items-center gap-4 rounded-[24px] border border-border bg-card p-6">
      <CheckBadge size="lg" />
      <div>
        <p className="text-[19px] font-bold text-heading">You&apos;re all caught up.</p>
        <p className="text-[16px] text-label-secondary">Come back after your next class.</p>
      </div>
    </div>
  )
}

/** Loop'd tells the student what to study next, in order, with a short time estimate. */
export function StudyPlan(props: Props) {
  const { steps } = props
  const todo = steps.filter((s) => !s.done).length
  if (steps.length === 0) return <AllDone />
  return (
    <section aria-labelledby="plan-title" className="flex flex-col gap-5 rounded-[24px] border border-border bg-card p-5 md:p-7">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Today&apos;s plan</p>
          <h2 id="plan-title" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">
            {todo === 0 ? "All done for today" : `Your next ${plural(todo, "step")}`}
          </h2>
        </div>
        {todo > 0 && (
          <p className="flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-label-secondary tabular-nums">
            <Clock aria-hidden className="size-4" />
            About {planMinutes(steps)} min
          </p>
        )}
      </header>
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const row = rowFor(step, props)
          const next = !step.done && index === steps.length - todo
          return (
            <li key={`${step.kind}-${index}`} style={{ "--i": index } as React.CSSProperties} className="animate-rise">
              <button
                type="button"
                onClick={row.onStart}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-[16px] border-2 p-4 text-left",
                  PRESS,
                  next && "border-heading bg-card",
                  !next && !step.done && "border-transparent bg-fill hover:border-input",
                  step.done && "border-transparent bg-card hover:bg-fill",
                )}
              >
                <StepChip number={index + 1} done={step.done} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={cn("text-[17px] leading-snug font-bold", step.done ? "text-subtle line-through decoration-2" : "text-heading")}>
                    {row.title}
                  </span>
                  {!step.done && <span className="text-[15px] text-label-secondary">{row.why}</span>}
                </span>
                {step.done ? (
                  <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[13px] font-bold text-primary">Done</span>
                ) : (
                  <span className="hidden shrink-0 text-[13px] font-medium text-subtle tabular-nums sm:inline">{row.minutes} min</span>
                )}
                {next && (
                  <span className="hidden h-11 shrink-0 items-center gap-1.5 rounded-full bg-heading px-5 text-[15px] font-bold text-primary-foreground sm:inline-flex">
                    Start
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
                {!step.done && (
                  <ArrowRight
                    aria-hidden
                    className={cn("size-5 shrink-0 transition-transform group-hover:translate-x-0.5", next ? "text-heading sm:hidden" : "text-subtle")}
                  />
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
