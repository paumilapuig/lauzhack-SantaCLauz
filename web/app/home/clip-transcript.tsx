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

export function ClipTranscript({ transcript, saved, translate, onToggle, char }: Props) {
  const active = activeWordStart(transcript, char)
  const pieces: React.ReactNode[] = []
  let cursor = 0

  for (const { start, end } of tokenize(transcript)) {
    if (start > cursor) pieces.push(transcript.slice(cursor, start))
    cursor = end
    const text = transcript.slice(start, end)
    const className = style(active !== null && active >= start && active < end, active !== null && start > active)
    const word = text.toLowerCase()
    const translation = translate(word)
    pieces.push(
      <span key={start} className={className}>
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
  if (cursor < transcript.length) pieces.push(transcript.slice(cursor))

  return (
    <p lang="fr" className="max-w-[34em] text-[19px] leading-[2] tracking-[-0.005em]">
      {pieces}
    </p>
  )
}
