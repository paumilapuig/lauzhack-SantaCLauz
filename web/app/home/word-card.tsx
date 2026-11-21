import { ChevronRight } from "lucide-react"
import type { WordToPractice } from "@/lib/student-contract"

export function WordCard({ word, onPractice }: { word: WordToPractice; onPractice: () => void }) {
  return (
    <article className="flex items-center justify-between gap-6 py-6">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 lang="fr" className="text-[24px] font-semibold tracking-[-0.015em]">{word.lemma}</h3>
          <span lang="es" className="text-[19px] text-word-yellow">{word.translation_es}</span>
        </div>
        <p lang="fr" className="text-[15px] text-label-secondary">{word.definition_fr}</p>
      </div>
      <button
        type="button"
        onClick={onPractice}
        className="inline-flex h-11 shrink-0 touch-manipulation items-center gap-1 rounded-full bg-fill pr-3 pl-5 text-[15px] font-semibold text-primary transition-colors hover:bg-fill-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Practicar
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </article>
  )
}
