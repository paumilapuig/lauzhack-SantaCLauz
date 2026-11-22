import type { PracticeModeItem } from "./practice-modes-list"
import { SuggestedTag } from "./suggested-tag"

type Props = {
  modes: PracticeModeItem[]
  wordCount: number | ((mode: PracticeModeItem) => number)
  suggested?: string
  onOpen: (id: string) => void
}

/** Practice modes as big blocks: the whole page when there is no clip left to review. */
export function PracticeModesGrid({ modes, wordCount, suggested, onOpen }: Props) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((mode, index) => {
        const { id, name, description, icon: Icon, minWords } = mode
        const disabled = (typeof wordCount === "function" ? wordCount(mode) : wordCount) < minWords
        return (
          <li key={id} style={{ "--i": index } as React.CSSProperties} className="animate-rise">
            <button
              type="button"
              aria-disabled={disabled}
              onClick={() => !disabled && onOpen(id)}
              className={`group flex h-full min-h-48 w-full touch-manipulation flex-col justify-between gap-6 rounded-[24px] border-2 bg-card p-6 text-left transition-[transform,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:p-7 ${suggested === id && !disabled ? "border-heading" : "border-border"} ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-input-hover active:scale-[0.96] motion-reduce:active:scale-100"}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex size-14 items-center justify-center rounded-[16px] bg-brand-orange-soft transition-transform duration-150 group-hover:scale-105">
                  <Icon className="size-6 text-brand-orange" strokeWidth={2.25} aria-hidden />
                </span>
                {suggested === id && !disabled && <SuggestedTag />}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">{name}</span>
                <span className="text-[15px] text-label-secondary">
                  {disabled ? `You need at least ${minWords} words` : description}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
