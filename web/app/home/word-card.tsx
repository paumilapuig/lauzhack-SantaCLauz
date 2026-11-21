import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { WordToPractice } from "@/lib/student-contract"

export function WordCard({ word, onPractice }: { word: WordToPractice; onPractice: () => void }) {
  return (
    <Card>
      <div className="flex flex-col gap-1 px-(--card-spacing)">
        <span lang="fr" className="text-2xl font-semibold">{word.lemma}</span>
        <span lang="es">{word.translation_es}</span>
        <span lang="fr" className="text-muted-foreground">{word.definition_fr}</span>
      </div>
      <div className="px-(--card-spacing)">
        <Button onClick={onPractice}>Practicar</Button>
      </div>
    </Card>
  )
}
