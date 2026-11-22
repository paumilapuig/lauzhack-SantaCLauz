"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { StatusPill } from "./status-pill"

export const MAX_LEVEL = 3
const FILL_DELAY_MS = 250

type Props = { word: string; translation: string; level: number; gained?: boolean; index?: number }

/** "What Loop'd knows": the word, 3 pills that fill up to its level, and whether help is still on. */
export function LevelMeter({ word, translation, level, gained = false, index = 0 }: Props) {
  const [filled, setFilled] = useState(!gained)
  useEffect(() => {
    if (filled) return
    const timer = setTimeout(() => setFilled(true), FILL_DELAY_MS + index * 100)
    return () => clearTimeout(timer)
  }, [filled, index])
  const shown = filled ? level : level - 1

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className="flex animate-rise flex-col gap-4 rounded-[16px] border border-border bg-card p-5 md:p-6"
    >
      <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">What Loop&apos;d knows</p>
      <div className="flex items-end justify-between gap-3">
        <p lang="fr" className="text-[32px] leading-none font-bold tracking-[-0.01em] text-heading md:text-[40px]">
          {word}
        </p>
        {gained && shown === level && (
          <span aria-hidden className="animate-plus-one text-[28px] leading-none font-bold text-brand-orange">
            +1
          </span>
        )}
      </div>
      <div role="img" aria-label={`Level ${level} of ${MAX_LEVEL}`} className="flex gap-3">
        {Array.from({ length: MAX_LEVEL }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[22px] flex-1 rounded-full transition-colors duration-400 ease-out",
              i < shown ? "bg-brand-orange" : "bg-fill",
              gained && i === shown - 1 && shown === level && "animate-pulse-once",
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-label-secondary tabular-nums">
          Level {shown} of {MAX_LEVEL}
        </p>
        <StatusPill level={shown} translation={translation} />
      </div>
    </article>
  )
}
