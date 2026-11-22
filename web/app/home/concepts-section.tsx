import type { ConceptAnswerResult, ConceptGap } from "@/lib/student-contract"
import { ConceptCard } from "./concept-card"

type Props = {
  concepts: ConceptGap[]
  onAnswer: (conceptId: string, answers: number[]) => Promise<ConceptAnswerResult>
  onUnderstood: (conceptId: string) => void
}

/** Ideas from class to understand better (from the "J'ai perdu le fil" moments, never named as such), shown in the mode dialog. */
export function ConceptsSection({ concepts, onAnswer, onUnderstood }: Props) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {concepts.map((gap) => (
        <ConceptCard key={gap.id} gap={gap} onAnswer={onAnswer} onUnderstood={onUnderstood} />
      ))}
    </div>
  )
}
