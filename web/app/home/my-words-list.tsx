"use client"

import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { MyWord } from "./types"

const UNDO_MS = 5000

type Props = { words: MyWord[]; onRemove: (lemma: string) => void }

function WordRow({ word, onRemove }: { word: MyWord; onRemove: (lemma: string) => void }) {
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
    <li className="flex min-h-11 items-center justify-between gap-4 py-2.5">
      {removed ? (
        <>
          <p className="text-[15px] leading-[20px] text-label-secondary">Quitada</p>
          <button type="button" className="h-11 shrink-0 px-2 text-[17px] text-primary" onClick={undo}>
            Deshacer
          </button>
        </>
      ) : (
        <>
          <p className="min-w-0 text-[17px] leading-[22px]">
            <span lang="fr" className="font-semibold">{word.lemma}</span>
            {word.translation_es && (
              <span lang="es" className="ml-2 text-word-yellow">{word.translation_es}</span>
            )}
          </p>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center"
            aria-label={`Quitar ${word.lemma}`}
            onClick={remove}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-fill text-label-secondary">
              <X aria-hidden className="size-4" />
            </span>
          </button>
        </>
      )}
    </li>
  )
}

export function MyWordsList({ words, onRemove }: Props) {
  if (words.length === 0) {
    return <p className="pt-3 text-[17px] leading-[22px] text-label-secondary">Aún no tienes palabras. Marca alguna en un clip.</p>
  }
  return (
    <ul className="divide-y divide-separator">
      {words.map((w) => (
        <WordRow key={w.lemma} word={w} onRemove={onRemove} />
      ))}
    </ul>
  )
}
