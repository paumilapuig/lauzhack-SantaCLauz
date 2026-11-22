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
          // a span, not a <button>: Chrome cannot start a text selection inside a button, and she may select a sentence
          <span
            key={index}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              if (!globalThis.getSelection?.()?.isCollapsed) return // she is selecting a sentence
              event.stopPropagation()
              onTap(piece.word!, text)
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return
              event.preventDefault()
              event.stopPropagation()
              onTap(piece.word!, text)
            }}
            className={`inline cursor-pointer rounded-[4px] p-0 text-inherit [letter-spacing:inherit] [word-spacing:inherit] transition-colors hover:bg-word-yellow-bg focus-visible:outline-2 focus-visible:outline-primary ${
              saved.has(piece.word) ? "underline decoration-word-yellow decoration-dashed decoration-2 underline-offset-4" : ""
            }`}
          >
            {piece.text}
          </span>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </span>
  )
}
