import type { PracticeModeItem } from "./practice-modes-list"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModeTag } from "./mode-tag"

type Props = {
  modes: PracticeModeItem[]
  wordCount: number | ((mode: PracticeModeItem) => number)
  suggested?: string
  played?: string[]
  onOpen: (id: string) => void
}

/** Practice modes as big blocks: the whole page once every clip is reviewed. The suggested game comes first, wide. */
export function PracticeModesGrid({ modes, wordCount, suggested, played = [], onOpen }: Props) {
  const ordered = [...modes.filter((m) => m.id === suggested), ...modes.filter((m) => m.id !== suggested)]
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {ordered.map((mode, index) => {
        const { id, name, description, icon: Icon, minWords } = mode
        const disabled = (typeof wordCount === "function" ? wordCount(mode) : wordCount) < minWords
        const featured = suggested === id && !disabled
        return (
          <li key={id} style={{ "--i": index } as React.CSSProperties} className={cn("animate-rise", featured && "sm:col-span-2")}>
            <button
              type="button"
              aria-disabled={disabled}
              onClick={() => !disabled && onOpen(id)}
              className={`group flex h-full min-h-52 w-full touch-manipulation flex-col justify-between gap-6 rounded-[24px] border-2 bg-card p-6 text-left transition-[transform,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:p-7 ${featured ? "border-heading" : "border-border"} ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-input-hover active:scale-[0.96] motion-reduce:active:scale-100"}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex size-14 items-center justify-center rounded-[16px] bg-brand-orange-soft transition-transform duration-150 group-hover:scale-105">
                  <Icon className="size-6 text-brand-orange" strokeWidth={2.25} aria-hidden />
                </span>
                {!disabled && <ModeTag suggested={featured} played={played.includes(id)} />}
              </span>
              <span className="flex flex-col gap-1">
                <span className={cn("leading-tight font-bold tracking-[-0.01em] text-heading", featured ? "text-[32px]" : "text-[22px]")}>{name}</span>
                <span className="flex items-end justify-between gap-4">
                  <span className="text-[15px] text-label-secondary">{disabled ? `You need at least ${minWords} words` : description}</span>
                  {featured && (
                    <span className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-heading px-6 text-[16px] font-bold text-primary-foreground">
                      Start
                      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
