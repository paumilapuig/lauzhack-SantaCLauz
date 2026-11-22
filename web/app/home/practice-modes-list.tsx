import type { LucideIcon } from "lucide-react"
import type { Need } from "./usable-words"

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
  onOpen: (id: string) => void
}

export function PracticeModesList({ modes, wordCount, onOpen }: Props) {
  return (
    <ul className="flex flex-col gap-1">
      {modes.map((mode) => {
        const { id, name, description, icon: Icon, minWords } = mode
        const disabled = (typeof wordCount === "function" ? wordCount(mode) : wordCount) < minWords
        const reason = `Necesitas al menos ${minWords} palabras`
        return (
          <li key={id}>
            <button
              type="button"
              aria-disabled={disabled}
              title={disabled ? reason : undefined}
              onClick={() => !disabled && onOpen(id)}
              className={`flex w-full items-center gap-3 rounded-full px-3 py-3 text-left transition-colors hover:bg-fill ${disabled ? "opacity-40" : ""}`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card border border-border">
                <Icon className="size-4 text-label" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-5 font-bold tracking-[-0.01em]">{name}</span>
                <span className="block text-[13px] leading-4 text-label-secondary">{disabled ? reason : description}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
