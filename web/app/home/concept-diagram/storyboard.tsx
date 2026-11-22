"use client"

import { ArrowRight } from "lucide-react"
import { useEffect, useRef } from "react"
import type { ConceptStep } from "@/lib/student-contract"
import styles from "./diagram.module.css"
import { TappableText } from "./tappable-text"

type Props = {
  steps: ConceptStep[]
  current: number
  saved: ReadonlySet<string>
  onTap: (word: string, keyPhrase: string) => void
  onSelectStep: (step: number) => void
}

const BADGE = { current: "bg-[#F47D31] text-white", done: "bg-[#0E101A] text-white", later: "bg-[#EBEBEB] text-[#707070]" }

const stateOf = (step: number, current: number) => (step === current ? "current" : step < current ? "done" : "later")

/**
 * The diagram of a concept that has no boxes (older concepts): its steps as a strip of cards,
 * each with its emoji line and sentence, linked by arrows. Same states as the box diagram.
 */
export function ConceptStoryboard({ steps, current, saved, onTap, onSelectStep }: Props) {
  const strip = useRef<HTMLOListElement>(null)
  useEffect(() => {
    // on a narrow screen, bring the current step into the strip (only the strip scrolls, never the page)
    const card = strip.current?.children[current] as HTMLElement | undefined
    if (strip.current && card) strip.current.scrollTo?.({ left: card.offsetLeft - strip.current.offsetLeft - 8, behavior: "smooth" })
  }, [current])
  return (
    <figure aria-label="Diagram of the idea, step by step" className="rounded-[16px] border border-[#EBEBEB] bg-[#F5F5F5] p-3">
      <ol ref={strip} className="flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto p-2">
        {steps.map((step, i) => {
          const state = stateOf(i, current)
          return (
            <li key={`${i}-${state}`} aria-current={state === "current" ? "step" : undefined} className="flex shrink-0 snap-start items-center gap-1">
              {i > 0 && <ArrowRight aria-hidden className={`size-5 shrink-0 ${state === "later" ? "text-[#D9D9D9]" : "text-[#F47D31]"}`} strokeWidth={2.5} />}
              <div
                onClick={() => onSelectStep(i)}
                className={`${styles.box} ${state === "current" ? `${styles.current} border-[#F47D31]` : "border-[#EBEBEB]"} ${
                  state === "later" ? "opacity-45" : ""
                } flex h-full w-[208px] flex-col gap-2 rounded-[16px] border-2 bg-white p-4`}
              >
                <span className={`inline-flex size-7 items-center justify-center rounded-full text-[13px] font-bold tabular-nums ${BADGE[state]}`}>{i + 1}</span>
                {step.visual?.trim() && (
                  <span aria-hidden className={`${state === "current" ? styles.pop : ""} text-[28px] leading-tight`}>{step.visual}</span>
                )}
                {state === "later" ? (
                  <span lang="fr" className="text-[15px] leading-snug font-bold text-[#1F243C]">{step.fr}</span>
                ) : (
                  <TappableText text={step.fr} saved={saved} onTap={onTap} className="text-[15px] leading-snug font-bold text-[#1F243C]" />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}
