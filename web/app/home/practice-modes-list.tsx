import type { LucideIcon } from "lucide-react"
import type { Need } from "./usable-words"
import { SuggestedTag } from "./suggested-tag"

export type PracticeModeItem = {
  id: string
  name: string
  description: string
  icon: LucideIcon
  minWords: number
  needs: Need[]
}

type Props = {
  modes: PracticeModeItem[]
  wordCount: number | ((mode: PracticeModeItem) => number)
  /** the game the study plan recommends */
  suggested?: string
  onOpen: (id: string) => void
}

export function PracticeModesList({ modes, wordCount, suggested, onOpen }: Props) {
  return (
    <ul className="flex flex-col gap-1">
      {modes.map((mode) => {
        const { id, name, description, icon: Icon, minWords } = mode
        const disabled = (typeof wordCount === "function" ? wordCount(mode) : wordCount) < minWords
        const reason = `You need at least ${minWords} words`
        return (
          <li key={id}>
            <button
              type="button"
              aria-disabled={disabled}
              title={disabled ? reason : undefined}
              onClick={() => !disabled && onOpen(id)}
              className={`flex w-full touch-manipulation items-center gap-3 rounded-[16px] px-2 py-2.5 text-left transition-[background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${disabled ? "cursor-not-allowed opacity-40" : "hover:bg-fill active:scale-[0.96] motion-reduce:active:scale-100"}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-brand-orange-soft">
                <Icon className="size-5 text-brand-orange" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[15px] leading-5 font-bold tracking-[-0.01em] text-heading">
                  {name}
                  {suggested === id && !disabled && <SuggestedTag />}
                </span>
                <span className="block text-[13px] leading-4 text-label-secondary">{disabled ? reason : description}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
