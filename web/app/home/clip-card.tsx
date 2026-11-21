"use client"

import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Word } from "@/components/ui/word"
import type { HomeClip, WordToPractice } from "@/lib/student-contract"
import { speak } from "./speech"
import { splitByTerms } from "./transcript"

const SLOW_RATE = 0.85

function playClip(clip: HomeClip) {
  const fallback = () => speak(clip.transcript, SLOW_RATE)
  try {
    new Audio(clip.audio_url).play().catch(fallback)
  } catch {
    fallback()
  }
}

export function ClipCard({ clip, words }: { clip: HomeClip; words: WordToPractice[] }) {
  const translations = new Map(words.map((w) => [w.lemma, w.translation_es]))
  const time = new Date(clip.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2 px-(--card-spacing)">
        <h3 className="font-medium">{clip.lesson_title}</h3>
        <span className="text-muted-foreground">{time}</span>
      </div>
      <p className="px-(--card-spacing) text-lg leading-relaxed">
        {splitByTerms(clip.transcript, clip.terms).map((seg, i) => {
          const translation = seg.lemma ? translations.get(seg.lemma) : undefined
          return translation ? (
            <Word key={i} text={seg.text} translation={translation} state="yellow" onTap={() => {}} />
          ) : (
            <span key={i} lang="fr">{seg.text}</span>
          )
        })}
      </p>
      <div className="px-(--card-spacing)">
        <Button onClick={() => playClip(clip)}>
          <Play aria-hidden /> Escuchar
        </Button>
      </div>
    </Card>
  )
}
