import type { PracticeModeItem } from "./practice-modes-list"

type Props = {
  modes: PracticeModeItem[]
  wordCount: number | ((mode: PracticeModeItem) => number)
  onOpen: (id: string) => void
}

/** Practice modes as big blocks: the whole page when there is no clip left to review. */
export function PracticeModesGrid({ modes, wordCount, onOpen }: Props) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((mode) => {
        const { id, name, description, icon: Icon, minWords } = mode
        const disabled = (typeof wordCount === "function" ? wordCount(mode) : wordCount) < minWords
        return (
          <li key={id}>
            <button
              type="button"
              aria-disabled={disabled}
              onClick={() => !disabled && onOpen(id)}
              className={`flex h-full min-h-48 w-full flex-col justify-between gap-6 rounded-[24px] border border-border bg-card p-6 text-left transition-[transform,border-color] duration-[120ms] ease-out hover:border-input active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:p-8 ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-fill">
                <Icon className="size-6 text-label" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[24px] leading-tight font-bold tracking-[-0.5px]">{name}</span>
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
