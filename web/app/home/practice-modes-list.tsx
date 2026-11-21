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
    <ul className="grid gap-x-4 sm:grid-cols-2">
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
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-fill ${disabled ? "opacity-40" : ""}`}
            >
              <Icon className="size-[18px] shrink-0 text-label-secondary" strokeWidth={1.5} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] leading-[24px] font-medium">{name}</span>
                <span className="block text-[15px] leading-[20px] text-label-secondary">{disabled ? reason : description}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
