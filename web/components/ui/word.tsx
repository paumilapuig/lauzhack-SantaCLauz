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
}: {
  text: string
  translation: string
  state: WordState
  onTap: () => void
}) {
  const glossId = useId()
  const [tapped, setTapped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const showTranslation = state !== "green" || revealed

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
        "inline-flex min-h-11 min-w-11 flex-col items-center justify-center rounded-sm",
        "data-[tapped]:bg-word-yellow-bg"
      )}
    >
      <span className={UNDERLINE[state === "green" && revealed ? "yellow" : state]}>
        {text}
        {state === "orange" && (
          <>
            <History aria-hidden className="inline size-[0.5em] align-super text-word-orange" />
            <span className="sr-only">ya la tocaste antes</span>
          </>
        )}
      </span>
      {showTranslation && (
        <span id={glossId} lang="es" className="text-[max(14px,0.45em)] leading-[1.1] font-normal text-word-yellow">
          {translation}
        </span>
      )}
    </button>
  )
}
