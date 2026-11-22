"use client"

import { ChevronLeft, Play } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import type { ConceptGap, ConceptWordResult } from "@/lib/student-contract"
import { ConceptDiagram } from "./diagram"
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
          <ConceptDiagram layout={layout} current={finished ? steps.length : current} saved={saved} onTap={tap} />
        </div>
      </div>
      <div aria-live="polite" className="flex flex-col gap-3 rounded-[20px] bg-fill p-5">
        <div className="flex items-center gap-1.5" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-primary" : i < current ? "w-4 bg-charcoal" : "w-4 bg-border"}`} />
          ))}
        </div>
        <p className="text-[20px] leading-snug font-semibold text-label">
          <TappableText text={step.fr} saved={saved} onTap={tap} />
        </p>
        {showSpanish ? (
          <p lang="es" className="text-[16px] text-label-secondary">{step.es}</p>
        ) : (
          <button type="button" onClick={() => setShowSpanish(true)} className="w-fit text-[14px] font-semibold text-primary underline underline-offset-4">
            Show in Spanish
          </button>
        )}
        {gloss && (
          <p role="status" className="w-fit rounded-full bg-word-yellow-bg px-4 py-1.5 text-[15px] text-[#2D2C2B]">
            <span lang="fr" className="font-bold">{gloss.word}</span>
            {" → "}
            <span lang="es">{gloss.es ?? "…"}</span>
            <span className="text-label-secondary"> · saved to your words</span>
          </p>
        )}
        <p className="text-[13px] text-label-secondary">Tap any word you don’t understand.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {current > 0 && !finished && (
          <button type="button" onClick={() => go(current - 1)} className={`${PILL} bg-card text-label ring-1 ring-border`}>
            <ChevronLeft aria-hidden className="size-4" /> Back
          </button>
        )}
        {next && (
          <button type="button" onClick={() => go(current + 1)} className={`${PILL} bg-primary text-primary-foreground`}>
            Explore{nextLabel ? `: ${nextLabel}` : ""} <Play aria-hidden className="size-4 fill-current" />
          </button>
        )}
        {!next && !finished && (
          <button type="button" onClick={() => setFinished(true)} className={`${PILL} bg-primary text-primary-foreground`}>
            Check what you understood <Play aria-hidden className="size-4 fill-current" />
          </button>
        )}
      </div>
      {finished && questions}
    </div>
  )
}
