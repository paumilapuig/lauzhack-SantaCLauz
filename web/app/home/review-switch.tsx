"use client"

import { CircleHelp, Rewind, type LucideIcon } from "lucide-react"
import type { KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

export type ReviewView = "vocab" | "context"

const TABS: { id: ReviewView; label: string; Icon: LucideIcon }[] = [
  { id: "vocab", label: "Vocab", Icon: Rewind },
  { id: "context", label: "Context", Icon: CircleHelp },
]

type Props = { value: ReviewView; counts: Record<ReviewView, number>; onChange: (view: ReviewView) => void }

export const tabId = (view: ReviewView) => `review-tab-${view}`
export const panelId = (view: ReviewView) => `review-panel-${view}`

/** Two learning paths, one slider: words from the clips (Vocab) or ideas from class (Context). */
export function ReviewSwitch({ value, counts, onChange }: Props) {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const next = value === "vocab" ? "context" : "vocab"
    onChange(next)
    document.getElementById(tabId(next))?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="What to review"
      onKeyDown={onKeyDown}
      className="relative grid w-full max-w-[440px] grid-cols-2 rounded-full border border-border bg-card p-1.5"
    >
      <span
        aria-hidden
        className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-full bg-heading transition-transform duration-300 ease-[var(--ease-out-cubic)]"
        style={{ transform: value === "context" ? "translateX(100%)" : "none" }}
      />
      {TABS.map(({ id, label, Icon }) => {
        const selected = value === id
        return (
          <button
            key={id}
            id={tabId(id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              "relative z-10 flex h-12 touch-manipulation items-center justify-center gap-2 rounded-full text-[16px] font-bold transition-[color,transform] duration-200 active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              selected ? "text-primary-foreground" : "text-label-secondary hover:text-heading",
            )}
          >
            <Icon aria-hidden className="size-4" strokeWidth={2.25} />
            {label}
            {counts[id] > 0 && (
              <span
                className={cn(
                  "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[13px] tabular-nums transition-colors",
                  selected ? "bg-white/20 text-primary-foreground" : "bg-brand-orange-soft text-heading",
                )}
              >
                {counts[id]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
