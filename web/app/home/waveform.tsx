const BARS = 64

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

type Props = {
  seed: string
  /** [start, end] of the marked word as fractions of the clip (0–1) */
  mark: [number, number] | null
  markLabel?: string
  playing: boolean
  durationMs: number
}

export function Waveform({ seed, mark, markLabel, playing, durationMs }: Props) {
  const heights = barHeights(seed)
  const inMark = (i: number) => mark !== null && i / BARS >= mark[0] && i / BARS <= mark[1]
  const bars = (played: boolean) =>
    heights.map((height, i) => (
      <span
        key={i}
        style={{ height: `${height * 100}%` }}
        className={
          inMark(i)
            ? "w-[3px] rounded-full bg-marker-strong"
            : played
              ? "w-[3px] rounded-full bg-background"
              : "w-[3px] rounded-full bg-background/30"
        }
      />
    ))

  return (
    <div aria-hidden className="relative h-20">
      {mark && markLabel && (
        <span
          style={{ left: `${Math.min(mark[0], 0.75) * 100}%` }}
          className="absolute -top-7 text-lg text-marker-strong font-[family-name:var(--font-kalam)]"
        >
          {markLabel}
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-between">{bars(false)}</div>
      <div
        style={{
          clipPath: playing ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transitionDuration: playing ? `${durationMs}ms` : "0ms",
        }}
        className="absolute inset-0 flex items-center justify-between transition-[clip-path] ease-linear"
      >
        {bars(true)}
      </div>
    </div>
  )
}
