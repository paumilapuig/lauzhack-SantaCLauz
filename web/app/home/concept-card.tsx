"use client"

import { useState } from "react"
import type { ConceptAnswerResult, ConceptGap, ConceptWordResult } from "@/lib/student-contract"
import { ConceptExplorer } from "./concept-diagram/explorer"

type Props = {
  gap: ConceptGap
  onAnswer: (conceptId: string, answers: number[]) => Promise<ConceptAnswerResult>
  onUnderstood: (conceptId: string) => void
  onTapWord: (conceptId: string, word: string, keyPhrase: string) => Promise<ConceptWordResult>
}

const CHECK_BUTTON =
  "inline-flex h-11 w-fit items-center rounded-full bg-charcoal px-5 text-[15px] font-bold text-primary-foreground shadow-[var(--shadow-subtle)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"

/** One idea from class, explained step by step on its diagram, then 2–3 questions. */
export function ConceptCard({ gap, onAnswer, onUnderstood, onTapWord }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(gap.exercises.map(() => null))
  const [result, setResult] = useState<ConceptAnswerResult | null>(null)
  const [checking, setChecking] = useState(false)

  async function check() {
    setChecking(true)
    try {
      const outcome = await onAnswer(gap.id, answers.map((a) => a ?? 0))
      setResult(outcome)
      if (outcome.status === "understood") onUnderstood(gap.id)
    } finally {
      setChecking(false)
    }
  }

  const questions = (
    <div className="flex flex-col gap-5 border-t border-separator pt-6">
      {gap.exercises.map((exercise, q) => (
        <fieldset key={q} className="flex flex-col gap-2">
          <legend lang="fr" className="mb-1 text-[16px] font-bold">
            {exercise.question}
            {result && <span className="ml-2 font-medium text-label-secondary">{result.correct[q] ? "✓" : "✗"}</span>}
          </legend>
          {exercise.options.map((option, o) => (
            <label key={o} lang="fr" className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border border-border px-4 has-[:checked]:border-charcoal">
              <input
                type="radio"
                name={`${gap.id}-${q}`}
                checked={answers[q] === o}
                onChange={() => setAnswers((current) => current.map((a, i) => (i === q ? o : a)))}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="button" onClick={check} disabled={checking || answers.includes(null)} className={CHECK_BUTTON}>
        Check
      </button>
      {result?.status === "review" && (
        <p role="status" className="text-[15px] text-label-secondary">
          Some answers are not right yet. Read the steps again and retry.
        </p>
      )}
    </div>
  )

  return (
    <article className="flex flex-col gap-6 rounded-[24px] border border-border bg-card p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-[13px] text-label-secondary" lang="fr">{gap.lesson_title}</p>
        <h3 lang="fr" className="text-[22px] leading-tight font-bold tracking-[-0.5px]">{gap.concept}</h3>
      </header>
      <ConceptExplorer gap={gap} onTapWord={onTapWord} questions={questions} />
    </article>
  )
}
