import { ArrowRight } from "lucide-react"
import { HAND, Highlight } from "@/components/notebook"
import { Button } from "@/components/ui/button"
import type { WordToPractice } from "@/lib/student-contract"

// Ruled paper: one line every 32px, with the red margin of a vocabulary card
export const RULED =
  "bg-[repeating-linear-gradient(to_bottom,transparent_0_31px,#E7E2D6_31px_32px)] bg-card"

export function WordCard({ word, onPractice }: { word: WordToPractice; onPractice: () => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(27,31,36,0.06),0_12px_32px_-20px_rgba(27,31,36,0.3)] transition-transform hover:-translate-y-0.5">
      <div className={`relative flex flex-col pt-8 pr-6 pb-8 pl-14 ${RULED}`}>
        <span aria-hidden className="absolute inset-y-0 left-10 w-px bg-word-orange/40" />
        <h3 lang="fr" className="text-[34px] leading-[64px] font-bold">
          <Highlight>{word.lemma}</Highlight>
        </h3>
        <p lang="es" className={`text-2xl leading-8 text-lost ${HAND}`}>{word.translation_es}</p>
        <p lang="fr" className="leading-8 text-muted-foreground">{word.definition_fr}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-4 border-t border-border px-6 py-4">
        <span className="text-muted-foreground">3 actividades</span>
        <Button onClick={onPractice}>
          Practicar <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </article>
  )
}
