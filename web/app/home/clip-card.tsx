"use client"

import { Play, Volume2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Word } from "@/components/ui/word"
import type { HomeClip, WordToPractice } from "@/lib/student-contract"
import { speak } from "./speech"
import { splitByTerms } from "./transcript"
import { Waveform } from "./waveform"

const SLOW_RATE = 0.85
const CHARS_PER_SECOND = 12

function playClip(clip: HomeClip) {
  const fallback = () => speak(clip.transcript, SLOW_RATE)
  try {
    new Audio(clip.audio_url).play().catch(fallback)
  } catch {
    fallback()
  }
}

function seconds(value: number) {
  const total = Math.round(value)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function ClipCard({ clip, words }: { clip: HomeClip; words: WordToPractice[] }) {
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const translations = new Map(words.map((w) => [w.lemma, w.translation_es]))
  const segments = splitByTerms(clip.transcript, clip.terms)
  const time = new Date(clip.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  // shortcut: playback length estimated from the transcript, until real audio duration is known
  const durationMs = (clip.transcript.length / CHARS_PER_SECOND / SLOW_RATE) * 1000

  let offset = 0
  let mark: [number, number] | null = null
  let markLabel: string | undefined
  for (const seg of segments) {
    if (!mark && seg.lemma && translations.has(seg.lemma)) {
      mark = [offset / clip.transcript.length, (offset + seg.text.length) / clip.transcript.length]
      markLabel = seg.text
    }
    offset += seg.text.length
  }

  function listen() {
    playClip(clip)
    clearTimeout(timer.current)
    // reset the sweep first so a second click starts it again from the left
    setPlaying(false)
    timer.current = setTimeout(() => {
      setPlaying(true)
      timer.current = setTimeout(() => setPlaying(false), durationMs)
    }, 50)
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(27,31,36,0.06),0_16px_40px_-24px_rgba(27,31,36,0.35)]">
      <div className="flex flex-col gap-8 bg-foreground p-6 text-background md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-background/70">Clip de clase · {time}</p>
            <h3 lang="fr" className="text-2xl font-bold">{clip.lesson_title}</h3>
          </div>
          <span className="shrink-0 rounded-full border border-background/20 px-3 py-1 font-mono text-sm text-background/80 tabular-nums">
            {Math.round(clip.t_end - clip.t_start)} s
          </span>
        </div>
        <Waveform seed={clip.id + clip.transcript} mark={mark} markLabel={markLabel} playing={playing} durationMs={durationMs} />
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={listen}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-background px-5 text-base font-bold text-foreground transition-[transform,background-color] hover:bg-marker active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marker-strong"
          >
            {playing ? <Volume2 aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}
            {playing ? "Escuchando…" : "Escuchar"}
          </button>
          <span className="font-mono text-sm text-background/70 tabular-nums">
            {seconds(clip.t_start)} – {seconds(clip.t_end)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-6 md:p-8">
        <p className="text-muted-foreground">Lo que dijo tu profe</p>
        <p lang="fr" className="text-[22px] leading-[2.1]">
          {segments.map((seg, i) => {
            const translation = seg.lemma ? translations.get(seg.lemma) : undefined
            return translation ? (
              <Word key={i} text={seg.text} translation={translation} state="yellow" onTap={() => {}} />
            ) : (
              <span key={i}>{seg.text}</span>
            )
          })}
        </p>
      </div>
    </article>
  )
}
