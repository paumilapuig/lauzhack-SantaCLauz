import type { ConceptAnswerResult, ConceptGap } from "@/lib/student-contract"
import { ConceptCard } from "./concept-card"

type Props = {
  concepts: ConceptGap[]
  onAnswer: (conceptId: string, answers: number[]) => Promise<ConceptAnswerResult>
  onUnderstood: (conceptId: string) => void
}

/** Ideas from class to understand better (from the "J'ai perdu le fil" moments, never named as such). */
export function ConceptsSection({ concepts, onAnswer, onUnderstood }: Props) {
  if (concepts.length === 0) return null
  return (
    <section aria-label="To understand better" className="mb-12 flex flex-col gap-4">
      <h2 className="text-[15px] font-bold tracking-[-0.02em] text-foreground">To understand better</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {concepts.map((gap) => (
          <ConceptCard key={gap.id} gap={gap} onAnswer={onAnswer} onUnderstood={onUnderstood} />
        ))}
      </div>
    </section>
  )
}
