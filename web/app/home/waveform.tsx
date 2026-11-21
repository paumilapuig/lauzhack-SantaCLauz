"use client"

import { useEffect, useRef, useState } from "react"

const BARS = 64
const MIN_LABEL_GAP_PX = 64

// Deterministic speech-like bar heights (0.15–1) from a seed, so each clip keeps its own shape
export function barHeights(seed: string, count = BARS): number[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const random = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  return Array.from({ length: count }, (_, i) => {
    const phrase = 0.55 + 0.45 * Math.sin((i / count) * Math.PI * 5)
    return Math.max(0.15, Math.min(1, phrase * (0.45 + 0.55 * random())))
  })
}

export type Mark = { at: number; label: string }

// Pure: sorts marks and drops any closer than MIN_LABEL_GAP_PX to the previous kept one (width 0 = unknown, keep all)
export function thinMarks(marks: Mark[], widthPx: number): Mark[] {
  const kept: Mark[] = []
  for (const mark of [...marks].sort((a, b) => a.at - b.at)) {
    const last = kept[kept.length - 1]
    if (!last || widthPx === 0 || (mark.at - last.at) * widthPx >= MIN_LABEL_GAP_PX) kept.push(mark)
  }
  return kept
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const measure = () => setWidth(ref.current?.offsetWidth ?? 0)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])
  return { ref, width }
}

type Props = {
  seed: string
  /** Saved words in the clip, positioned as fractions of the clip (0-1) */
  marks: Mark[]
  /** 0-1; the played part is drawn in ink */
  progress: number
  showHead: boolean
}

export function Waveform({ seed, marks, progress, showHead }: Props) {
  const { ref, width } = useWidth()
  const heights = barHeights(seed)
  const pins = thinMarks(marks, width)
  const bars = (color: string) =>
    heights.map((height, i) => (
      <span key={i} style={{ height: `${height * 100}%` }} className={`w-0.5 rounded-full ${color}`} />
    ))

  return (
    <div ref={ref} aria-hidden>
      <div className="relative h-16">
        <div className="absolute inset-0 flex items-center justify-between">{bars("bg-fill-strong")}</div>
        <div
          style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
          className="absolute inset-0 flex items-center justify-between"
        >
          {bars("bg-label")}
        </div>
        {pins.map((m) => (
          <span key={m.at} style={{ left: `${m.at * 100}%` }} className="absolute inset-y-0 w-0.5 bg-marker-strong" />
        ))}
        {showHead && (
          <span style={{ left: `${progress * 100}%` }} className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-label" />
        )}
      </div>
      <div className="relative h-4">
        {pins.map((m) => (
          <span
            key={m.at}
            style={{ left: `${m.at * 100}%` }}
            className="absolute top-1 -translate-x-1/2 whitespace-nowrap font-mono text-xs leading-4 text-word-yellow"
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}
