"use client"

import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { MyWord } from "./types"

const UNDO_MS = 5000

type Variant = "full" | "compact"
type Props = { words: MyWord[]; onRemove: (lemma: string) => void; variant?: Variant }

const ROW: Record<Variant, string> = { full: "h-12 gap-4", compact: "group h-9 gap-2" }
const WORD: Record<Variant, string> = {
  full: "text-[17px] leading-[24px]",
  compact: "text-[15px] leading-[20px]",
}
const REMOVE: Record<Variant, string> = {
  full: "size-11",
  compact: "size-9 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
}

function WordRow({ word, onRemove, variant }: { word: MyWord; onRemove: (lemma: string) => void; variant: Variant }) {
  const [removed, setRemoved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // the removal still pending; flushed on unmount so "Quitada" is never lost by leaving the page
  const pending = useRef<(() => void) | null>(null)
  useEffect(
    () => () => {
      clearTimeout(timer.current)
      pending.current?.()
    },
    [],
  )

  const remove = () => {
    setRemoved(true)
    pending.current = () => onRemove(word.lemma)
    timer.current = setTimeout(() => {
      pending.current = null
      onRemove(word.lemma)
    }, UNDO_MS)
  }
  const undo = () => {
    clearTimeout(timer.current)
    pending.current = null
    setRemoved(false)
  }

  return (
    <li className={`flex items-center justify-between ${ROW[variant]}`}>
      {removed ? (
        <>
          <p className="text-[15px] leading-[20px] text-label-secondary">Quitada</p>
          <button type="button" className="h-9 shrink-0 px-2 text-[15px] text-primary" onClick={undo}>
            Deshacer
          </button>
        </>
      ) : (
        <>
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-word-yellow" />
          <p className={`min-w-0 flex-1 truncate ${WORD[variant]}`}>
            <span lang="fr" className="font-medium">{word.lemma}</span>
            {word.translation_es && (
              <span lang="es" className="ml-2 text-word-yellow">{word.translation_es}</span>
            )}
          </p>
          <button
            type="button"
            className={`flex shrink-0 items-center justify-center text-label-secondary ${REMOVE[variant]}`}
            aria-label={`Quitar ${word.lemma}`}
            onClick={remove}
          >
            <X aria-hidden className="size-4" />
          </button>
        </>
      )}
    </li>
  )
}

export function MyWordsList({ words, onRemove, variant = "full" }: Props) {
  if (words.length === 0) {
    return <p className="pt-3 text-[17px] leading-[22px] text-label-secondary">Aún no tienes palabras. Marca alguna en un clip.</p>
  }
  return (
    <ul className="divide-y divide-separator rounded-2xl border border-border bg-card px-4">
      {words.map((w) => (
        <WordRow key={w.lemma} word={w} onRemove={onRemove} variant={variant} />
      ))}
    </ul>
  )
}
