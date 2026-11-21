"use client"

import { Play } from "lucide-react"
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

function clock(value: number) {
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
  for (const seg of segments) {
    if (!mark && seg.lemma && translations.has(seg.lemma)) {
      mark = [offset / clip.transcript.length, (offset + seg.text.length) / clip.transcript.length]
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
    <article className="flex flex-col gap-5 py-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={listen}
          aria-label={playing ? "Escuchando…" : "Escuchar"}
          className="flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-primary text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Play aria-hidden className="size-5 translate-x-px fill-current" />
        </button>
        <div className="flex min-w-0 flex-col">
          <h3 lang="fr" className="truncate text-[19px] font-semibold tracking-[-0.01em]">{clip.lesson_title}</h3>
          <p className="text-[15px] text-label-secondary tabular-nums">
            Clip de clase · {time} · {clock(clip.t_start)}–{clock(clip.t_end)}
          </p>
        </div>
      </div>
      <Waveform seed={clip.id + clip.transcript} mark={mark} playing={playing} durationMs={durationMs} />
      <p lang="fr" className="max-w-[34em] text-[21px] leading-[2.1] tracking-[-0.005em]">
        {segments.map((seg, i) => {
          const translation = seg.lemma ? translations.get(seg.lemma) : undefined
          return translation ? (
            <Word key={i} text={seg.text} translation={translation} state="yellow" onTap={() => {}} />
          ) : (
            <span key={i}>{seg.text}</span>
          )
        })}
      </p>
    </article>
  )
}
