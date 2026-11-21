import type { ReactNode } from "react"
import { Word } from "@/components/ui/word"
import { activeWordStart } from "./karaoke"
import { tokenize } from "./transcript"

// Bold drawn with a thin stroke in the text colour: same glyph widths, so the line never reflows
const BOLD = "text-label [-webkit-text-stroke:0.6px_currentColor]"
const style = (active: boolean, ahead: boolean) =>
  `transition-colors ${active ? BOLD : ahead ? "text-label-secondary" : ""}`

type Props = {
  transcript: string
  saved: Set<string>
  translate: (word: string) => string | null
  onToggle: (word: string, translation: string) => void
  char: number | null
}

type Chunk = { start: number; end: number }

// Groups of text that must never break inside: "l'oxygène", "glucose.", and French
// stand-alone punctuation (" :", " ;", " ?") glued to the word before it
export function unbreakableChunks(text: string): Chunk[] {
  const chunks: Chunk[] = []
  for (const m of text.matchAll(/\S+/g)) {
    const chunk = { start: m.index, end: m.index + m[0].length }
    const last = chunks[chunks.length - 1]
    if (last && !/\p{L}/u.test(m[0])) last.end = chunk.end
    else chunks.push(chunk)
  }
  return chunks
}

export function ClipTranscript({ transcript, saved, translate, onToggle, char }: Props) {
  const active = activeWordStart(transcript, char)
  const tokens = tokenize(transcript)

  const renderChunk = ({ start, end }: Chunk) => {
    const parts: ReactNode[] = []
    let cursor = start
    for (const token of tokens.filter((t) => t.start >= start && t.end <= end)) {
      // a space inside a chunk only comes from glued punctuation: keep it non-breaking
      if (token.start > cursor) parts.push(transcript.slice(cursor, token.start).replace(/\s+/g, " "))
      cursor = token.end
      const text = transcript.slice(token.start, token.end)
      const word = text.toLowerCase()
      const translation = translate(word)
      parts.push(
        <span
          key={token.start}
          className={style(active !== null && active >= token.start && active < token.end, active !== null && token.start > active)}
        >
          {translation ? (
            // key changes on save/unsave so an un-saved word drops the translation it revealed
            <Word
              key={saved.has(word) ? "saved" : "plain"}
              compact
              text={text}
              translation={translation}
              state={saved.has(word) ? "yellow" : "green"}
              onTap={() => onToggle(word, translation)}
            />
          ) : (
            text
          )}
        </span>,
      )
    }
    if (cursor < end) parts.push(transcript.slice(cursor, end).replace(/\s+/g, " "))
    return (
      <span key={start} className="whitespace-nowrap">
        {parts}
      </span>
    )
  }

  const chunks = unbreakableChunks(transcript)
  return (
    <p lang="fr" className="max-w-[38em] text-[20px] leading-10">
      {chunks.flatMap((chunk, i) => (i === 0 ? [renderChunk(chunk)] : [" ", renderChunk(chunk)]))}
    </p>
  )
}
