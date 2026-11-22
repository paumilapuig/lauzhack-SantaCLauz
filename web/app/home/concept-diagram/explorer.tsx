"use client"

import { ChevronLeft, Play } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import type { ConceptGap, ConceptWordResult } from "@/lib/student-contract"
import { ConceptDiagram } from "./diagram"
import styles from "./diagram.module.css"
import { layoutDiagram } from "./diagram-layout"
import { TappableText } from "./tappable-text"
import { glossFor } from "./words"

type Props = {
  gap: ConceptGap
  onTapWord: (conceptId: string, word: string, keyPhrase: string) => Promise<ConceptWordResult>
  questions: ReactNode
}

type Gloss = { word: string; es: string | null }

const PILL = "inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

/** Walk through the idea box by box on its diagram, in French; any word can be tapped for its Spanish. */
export function ConceptExplorer({ gap, onTapWord, questions }: Props) {
  const steps = gap.explanation
  const layout = useMemo(() => layoutDiagram(steps), [steps])
  const allWords = useMemo(() => steps.flatMap((s) => s.words ?? []), [steps])
  const [current, setCurrent] = useState(0)
  const [showSpanish, setShowSpanish] = useState(false)
  const [finished, setFinished] = useState(false)
  const [gloss, setGloss] = useState<Gloss | null>(null)
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set())

  async function tap(word: string, keyPhrase: string) {
    setGloss({ word, es: glossFor(word, steps[current].words ?? []) ?? glossFor(word, allWords) })
    setSaved((s) => new Set(s).add(word))
    try {
      const result = await onTapWord(gap.id, word, keyPhrase)
      if (result.translation_es) setGloss((g) => (g?.word === word ? { word, es: result.translation_es } : g))
    } catch {
      /* the translation is already shown; saving can be retried by tapping again */
    }
  }

  function go(step: number) {
    setFinished(false)
    setCurrent(step)
    setShowSpanish(false)
    setGloss(null)
  }

  const step = steps[current]
  const next = steps[current + 1]
  const nextLabel = next?.nodes?.[0]?.fr

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-2 overflow-x-auto px-2">
        <div className="min-w-[640px]">
          <ConceptDiagram layout={layout} current={finished ? steps.length : current} saved={saved} onTap={tap} onSelectStep={go} />
        </div>
      </div>
      <div aria-live="polite" className="flex flex-col gap-3 rounded-[16px] border border-[#EBEBEB] bg-white p-5">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Step ${i + 1}`}
              aria-current={i === current ? "step" : undefined}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-[#F47D31]" : i < current ? "w-4 bg-[#0E101A]" : "w-4 bg-[#D9D9D9]"}`}
            />
          ))}
        </div>
        <p key={current} className={`${styles.rise} text-[20px] leading-snug font-bold tracking-[-0.01em] text-[#1F243C]`}>
          <TappableText text={step.fr} saved={saved} onTap={tap} />
        </p>
        {showSpanish ? (
          <p lang="es" className="text-[16px] text-[#545454]">{step.es}</p>
        ) : (
          <button type="button" onClick={() => setShowSpanish(true)} className="w-fit text-[14px] font-semibold text-[#545454] underline underline-offset-4">
            Show in Spanish
          </button>
        )}
        {gloss && (
          <p role="status" key={gloss.word} className={`${styles.pop} w-fit rounded-[10px] bg-[#FFF4D1] px-4 py-1.5 text-[15px] text-[#8A5300]`}>
            <span lang="fr" className="font-bold">{gloss.word}</span>
            {" → "}
            <span lang="es">{gloss.es ?? "…"}</span>
            <span className="text-[#545454]"> · saved to your words</span>
          </p>
        )}
        <p className="text-[13px] text-[#707070]">Tap any word you don’t understand. Tap a box to jump to its step.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {current > 0 && !finished && (
          <button type="button" onClick={() => go(current - 1)} className={`${PILL} ${styles.press} border border-[#D9D9D9] bg-white text-[#1F243C]`}>
            <ChevronLeft aria-hidden className="size-4" /> Back
          </button>
        )}
        {next && (
          <button type="button" onClick={() => go(current + 1)} className={`${PILL} ${styles.press} bg-[#F47D31] text-white`}>
            Explore{nextLabel ? `: ${nextLabel}` : ""} <Play aria-hidden className="size-4 fill-current" />
          </button>
        )}
        {!next && !finished && (
          <button type="button" onClick={() => setFinished(true)} className={`${PILL} ${styles.press} bg-[#0E101A] text-white`}>
            Check what you understood <Play aria-hidden className="size-4 fill-current" />
          </button>
        )}
      </div>
      {finished && questions}
    </div>
  )
}
