import type { LucideIcon } from "lucide-react"
import type { Need } from "./usable-words"

export type PracticeModeItem = {
  id: string
  name: string
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
    <ul className="grid grid-cols-2 gap-3 pt-4">
      {modes.map((mode) => {
        const { id, name, icon: Icon, minWords } = mode
        const disabled = (typeof wordCount === "function" ? wordCount(mode) : wordCount) < minWords
        const reason = `Necesitas al menos ${minWords} palabras`
        return (
          <li key={id}>
            <button
              type="button"
              aria-disabled={disabled}
              title={disabled ? reason : undefined}
              onClick={() => !disabled && onOpen(id)}
              className={`flex min-h-16 w-full items-center gap-3 rounded-xl bg-fill px-3 text-left transition-colors hover:bg-fill-strong ${disabled ? "opacity-50" : ""}`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-primary text-white">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-[15px] font-semibold">{name}</span>
              {disabled && <span className="sr-only">{reason}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
