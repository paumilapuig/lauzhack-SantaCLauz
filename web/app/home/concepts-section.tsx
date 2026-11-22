import type { ConceptAnswerResult, ConceptGap, ConceptWordResult } from "@/lib/student-contract"
import { ConceptCard } from "./concept-card"

type Props = {
  concepts: ConceptGap[]
  onAnswer: (conceptId: string, answers: number[]) => Promise<ConceptAnswerResult>
  onUnderstood: (conceptId: string) => void
  onTapWord: (conceptId: string, word: string, keyPhrase: string) => Promise<ConceptWordResult>
}

/** Ideas from class to understand better (from the "J'ai perdu le fil" moments, never named as such). */
export function ConceptsSection({ concepts, onAnswer, onUnderstood, onTapWord }: Props) {
  if (concepts.length === 0) return null
  return (
    <section aria-label="To understand better" className="flex flex-col gap-4">
      <h2 className="text-[13px] font-bold tracking-[0.06em] text-subtle uppercase">To understand better</h2>
      <div className="flex max-w-[880px] flex-col gap-6">
        {concepts.map((gap) => (
          <ConceptCard key={gap.id} gap={gap} onAnswer={onAnswer} onUnderstood={onUnderstood} onTapWord={onTapWord} />
        ))}
      </div>
    </section>
  )
}
