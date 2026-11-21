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
  saved: Set<string>
  translate: (word: string) => string | null
  onToggle: (word: string, translation: string) => void
}

export function ClipCard({ clip, saved, translate, onToggle }: Props) {
  const playback = usePlayback(clip.transcript, clip.audio_url, SLOW_RATE)
  const time = new Date(clip.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  const marks = tokenize(clip.transcript)
    .map((t) => ({ at: t.start / clip.transcript.length, label: clip.transcript.slice(t.start, t.end).toLowerCase() }))
    .filter((m) => saved.has(m.label))

  const elapsed = playback.progress * playback.durationMs
  const position = Math.round(playback.progress * 1000)

  return (
    <article className="flex flex-col gap-4 py-6">
      <div className="flex flex-col gap-3">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] leading-5">
          <span lang="fr" className="font-medium text-label">{clip.lesson_title}</span>
          <span className="font-mono text-[13px] leading-4 tabular-nums text-label-secondary">
            {time} · {clock(clip.t_start * 1000)}–{clock(clip.t_end * 1000)}
          </span>
        </p>
        <ClipTranscript transcript={clip.transcript} saved={saved} translate={translate} onToggle={onToggle} char={playback.char} />
      </div>

      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={playback.toggle}
          aria-label={playback.playing ? "Pausar" : "Escuchar"}
          className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-label text-background transition-[transform,opacity] hover:opacity-90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-label"
        >
          {playback.playing ? (
            <Pause aria-hidden className="size-5 fill-current" />
          ) : (
            <Play aria-hidden className="size-5 translate-x-px fill-current" />
          )}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="relative rounded-md has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-label">
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
          <div className="flex justify-between font-mono text-[13px] leading-4 text-label-secondary tabular-nums">
            <span>{clock(elapsed)}</span>
            <span>{clock(playback.durationMs)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
