"use client"

import { useEffect, useId, useRef, useState } from "react"
import { History } from "lucide-react"
import { cn } from "cn"

export type WordState = "green" | "yellow" | "orange"

const TAP_FEEDBACK_MS = 600

const UNDERLINE: Record<WordState, string> = {
  green: "",
  yellow:
    "underline decoration-dashed decoration-2 decoration-word-yellow underline-offset-[0.18em]",
  orange:
    "underline decoration-double decoration-2 decoration-word-orange underline-offset-[0.18em]",
}

export function Word({
  text,
  translation,
  state,
  onTap,
  compact = false,
}: {
  text: string
  translation: string
  state: WordState
  onTap: () => void
  /** inside running text: no 44px minimum width, so short words keep normal spacing (height stays 44px) */
  compact?: boolean
}) {
  const glossId = useId()
  const [tapped, setTapped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const showTranslation = state !== "green" || revealed
  // at home (compact, inside the clip) a marked word is a soft yellow block, not an underline
  const marked = compact && state === "yellow"

  function handleClick() {
    onTap()
    setRevealed(true)
    setTapped(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTapped(false), TAP_FEEDBACK_MS)
  }

  return (
    <button
      type="button"
      lang="fr"
      data-state={state}
      data-tapped={tapped ? "" : undefined}
      aria-describedby={showTranslation ? glossId : undefined}
      onClick={handleClick}
      className={cn(
        "inline-flex min-h-11 touch-manipulation flex-col items-center justify-center rounded-[10px] transition-colors duration-200",
        !compact && "min-w-11",
        compact && "-mx-0.5 px-0.5 hover:bg-fill",
        marked && "animate-pulse-once bg-word-yellow-bg hover:bg-word-yellow-bg",
        "data-[tapped]:bg-word-yellow-bg"
      )}
    >
      <span className={marked ? "" : UNDERLINE[state === "green" && revealed ? "yellow" : state]}>
        {text}
        {state === "orange" && (
          <>
            <History aria-hidden className="inline size-[0.5em] align-super text-word-orange" />
            <span className="sr-only">you tapped it before</span>
          </>
        )}
      </span>
      {showTranslation && (
        <span id={glossId} lang="es" className="text-[max(14px,0.45em)] leading-[1.1] font-bold text-word-yellow">
          {translation}
        </span>
      )}
    </button>
  )
}
