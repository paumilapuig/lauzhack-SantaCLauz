import type { MyWord } from "./types"

type Props = { words: MyWord[]; onRemove: (lemma: string) => void }

const SOURCE_LABEL = { class: "De clase", home: "Marcada en casa" } as const

export function MyWordsList({ words, onRemove }: Props) {
  if (words.length === 0) {
    return <p className="text-label-secondary">Aún no tienes palabras. Marca alguna en la transcripción.</p>
  }
  return (
    <ul className="divide-y divide-separator">
      {words.map((w) => (
        <li key={w.lemma} className="flex items-center justify-between gap-4 py-5">
          <div>
            <p lang="fr" className="text-[24px] font-semibold">{w.lemma}</p>
            {w.translation_es && <p lang="es" className="text-word-yellow">{w.translation_es}</p>}
            <p className="text-[13px] text-label-secondary">{SOURCE_LABEL[w.source]}</p>
          </div>
          {w.source === "home" && (
            <button
              type="button"
              className="h-11 px-2 text-primary"
              aria-label={`Quitar ${w.lemma}`}
              onClick={() => onRemove(w.lemma)}
            >
              Quitar
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
