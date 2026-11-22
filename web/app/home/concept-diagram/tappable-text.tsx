"use client"

import { splitWords } from "./words"

type Props = {
  text: string
  saved: ReadonlySet<string>
  onTap: (word: string, keyPhrase: string) => void
  className?: string
}

/** French text where every word is a button: tapping asks for its Spanish and saves it to her hard words. */
export function TappableText({ text, saved, onTap, className }: Props) {
  return (
    <span lang="fr" className={className}>
      {splitWords(text).map((piece, index) =>
        piece.word ? (
          <button
            key={index}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onTap(piece.word!, text)
            }}
            className={`inline cursor-pointer rounded-[4px] p-0 text-inherit [letter-spacing:inherit] [word-spacing:inherit] transition-colors hover:bg-word-yellow-bg focus-visible:outline-2 focus-visible:outline-primary ${
              saved.has(piece.word) ? "underline decoration-word-yellow decoration-dashed decoration-2 underline-offset-4" : ""
            }`}
          >
            {piece.text}
          </button>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </span>
  )
}
