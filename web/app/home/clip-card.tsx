"use client"

import { Pause, Play } from "lucide-react"
import type { HomeClip } from "@/lib/student-contract"
import { ClipTranscript } from "./clip-transcript"
import { tokenize } from "./transcript"
import { usePlayback } from "./use-playback"
import { Waveform } from "./waveform"

const SLOW_RATE = 0.85

function clock(ms: number) {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

type Props = {
  clip: HomeClip
  index: number
  saved: Set<string>
  translate: (word: string) => string
  onToggle: (word: string, translation: string) => void
}

export function ClipCard({ clip, index, saved, translate, onToggle }: Props) {
  const playback = usePlayback(clip.transcript, clip.audio_url, SLOW_RATE)
  const time = new Date(clip.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  const marks = tokenize(clip.transcript)
    .map((t) => ({ at: t.start / clip.transcript.length, label: clip.transcript.slice(t.start, t.end).toLowerCase() }))
    .filter((m) => saved.has(m.label))

  const elapsed = playback.progress * playback.durationMs
  const position = Math.round(playback.progress * 1000)

  return (
    <article className="overflow-hidden rounded-[24px] border border-border bg-card">
      <div className="flex flex-col gap-6 px-6 pt-6 pb-2 md:px-8 md:pt-8">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[13px] font-medium tracking-[-0.01em] text-label-secondary tabular-nums">
            Clip {index + 1}
            <span aria-hidden className="mx-2 text-label-secondary/40">
              ·
            </span>
            <span lang="fr">{clip.lesson_title}</span>
          </p>
          <p className="shrink-0 text-[13px] tabular-nums text-label-secondary">
            {time} · {clock(clip.t_start * 1000)}–{clock(clip.t_end * 1000)}
          </p>
        </div>
        <ClipTranscript transcript={clip.transcript} saved={saved} translate={translate} onToggle={onToggle} char={playback.char} />
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-separator bg-fill/80 px-6 py-4 md:px-8">
        <button
          type="button"
          onClick={playback.toggle}
          aria-label={playback.playing ? "Pausar" : "Escuchar"}
          className="flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-charcoal text-primary-foreground shadow-[var(--shadow-subtle)] transition-[transform,opacity] hover:opacity-90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {playback.playing ? (
            <Pause aria-hidden className="size-5 fill-current" />
          ) : (
            <Play aria-hidden className="size-5 translate-x-px fill-current" />
          )}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="relative rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-primary">
            <Waveform seed={clip.id + clip.transcript} marks={marks} progress={playback.progress} showHead={playback.char !== null} />
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={position}
              onChange={(e) => playback.seek(Number(e.target.value) / 1000)}
              aria-label="Posición del audio"
              aria-valuetext={`${clock(elapsed)} de ${clock(playback.durationMs)}`}
              className="absolute inset-0 h-full w-full cursor-pointer touch-manipulation opacity-0"
            />
          </div>
          <div className="flex justify-between text-[13px] leading-4 text-label-secondary tabular-nums">
            <span>{clock(elapsed)}</span>
            <span>{clock(playback.durationMs)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
