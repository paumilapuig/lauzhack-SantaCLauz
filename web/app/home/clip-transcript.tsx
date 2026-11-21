import { Word } from "@/components/ui/word"
import { activeWordStart } from "./karaoke"
import { splitByTerms } from "./transcript"

// Bold drawn with a thin stroke in the text colour: same glyph widths, so the line never reflows
const BOLD = "text-label [-webkit-text-stroke:0.6px_currentColor]"
const style = (active: boolean, ahead: boolean) =>
  `transition-colors ${active ? BOLD : ahead ? "text-label-secondary" : ""}`

function Spoken({ text, active, ahead }: { text: string; active: boolean; ahead: boolean }) {
  return <span className={style(active, ahead)}>{text}</span>
}

type Props = { transcript: string; terms: string[]; translations: Map<string, string>; char: number | null }

export function ClipTranscript({ transcript, terms, translations, char }: Props) {
  const active = activeWordStart(transcript, char)
  const segments = splitByTerms(transcript, terms)
  const starts = segments.map((_, i) => segments.slice(0, i).reduce((sum, seg) => sum + seg.text.length, 0))

  return (
    <p lang="fr" className="max-w-[34em] text-[21px] leading-[2.1] tracking-[-0.005em]">
      {segments.map((seg, i) => {
        const start = starts[i]
        const end = start + seg.text.length
        const translation = seg.lemma ? translations.get(seg.lemma) : undefined
        if (translation) {
          const on = active !== null && active >= start && active < end
          const ahead = active !== null && start > active
          return (
            <span key={i} className={style(on, ahead)}>
              <Word text={seg.text} translation={translation} state="yellow" onTap={() => {}} />
            </span>
          )
        }
        const pieces = seg.text.split(/(\s+)/)
        return pieces.map((piece, k) => {
          const at = start + pieces.slice(0, k).join("").length
          if (!piece.trim()) return piece
          const on = active !== null && active >= at && active < at + piece.length
          return <Spoken key={`${i}-${k}`} text={piece} active={on} ahead={active !== null && at > active} />
        })
      })}
    </p>
  )
}
