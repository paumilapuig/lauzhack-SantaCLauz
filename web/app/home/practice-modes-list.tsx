import { ChevronRight, type LucideIcon } from "lucide-react"
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
    <ul className="divide-y divide-separator">
      {modes.map((mode) => {
        const { id, name, description, icon: Icon, minWords } = mode
        const disabled = (typeof wordCount === "function" ? wordCount(mode) : wordCount) < minWords
        return (
          <li key={id}>
            <button
              type="button"
              aria-disabled={disabled}
              onClick={() => !disabled && onOpen(id)}
              className={`flex min-h-16 w-full items-center gap-3 py-2 text-left transition-colors hover:bg-fill ${disabled ? "opacity-50" : ""}`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-primary text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-semibold">{name}</span>
                <span className="block text-[15px] text-label-secondary">
                  {disabled ? `Necesitas al menos ${minWords} palabras` : description}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-label-secondary" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
