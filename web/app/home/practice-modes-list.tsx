import { ChevronRight, type LucideIcon } from "lucide-react"
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
    <ul className="divide-y divide-separator">
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
              className={`flex min-h-11 w-full items-center gap-3 py-2 text-left ${disabled ? "opacity-40" : ""}`}
            >
              <span className="flex size-[29px] shrink-0 items-center justify-center rounded-[7px] bg-primary text-primary-foreground">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] leading-[22px]">{name}</span>
                {disabled && <span className="block text-[13px] leading-[18px] text-label-secondary">{reason}</span>}
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-label-secondary" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
