import type { MyWord } from "./types"

type Props = { words: MyWord[]; onRemove: (lemma: string) => void }

export function MyWordsList({ words, onRemove }: Props) {
  if (words.length === 0) {
    return <p className="pt-3 text-label-secondary">Aún no tienes palabras. Marca alguna en un clip.</p>
  }
  return (
    <ul className="divide-y divide-separator">
      {words.map((w) => (
        <li key={w.lemma} className="flex items-center justify-between gap-4 py-3">
          <p className="min-w-0">
            <span lang="fr" className="text-[19px] font-semibold">{w.lemma}</span>
            {w.translation_es && (
              <span lang="es" className="ml-2 text-[17px] text-word-yellow">{w.translation_es}</span>
            )}
          </p>
          <button
            type="button"
            className="h-11 shrink-0 px-2 text-primary"
            aria-label={`Quitar ${w.lemma}`}
            onClick={() => onRemove(w.lemma)}
          >
            Quitar
          </button>
        </li>
      ))}
    </ul>
  )
}
