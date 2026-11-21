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
  /** 0–1; the played part is drawn in ink */
  progress: number
  showHead: boolean
  /** Tailwind height class */
  heightClass?: string
}

export function Waveform({ seed, mark, progress, showHead, heightClass = "h-12" }: Props) {
  const heights = barHeights(seed)
  const inMark = (i: number) => mark !== null && i / BARS >= mark[0] && i / BARS <= mark[1]
  const bars = (played: boolean) =>
    heights.map((height, i) => (
      <span
        key={i}
        style={{ height: `${height * 100}%` }}
        className={
          inMark(i)
            ? "w-[2px] rounded-full bg-marker-strong"
            : played
              ? "w-[2px] rounded-full bg-label"
              : "w-[2px] rounded-full bg-fill-strong"
        }
      />
    ))

  return (
    <div aria-hidden className={`relative ${heightClass}`}>
      <div className="absolute inset-0 flex items-center justify-between">{bars(false)}</div>
      <div
        style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
        className="absolute inset-0 flex items-center justify-between"
      >
        {bars(true)}
      </div>
      {showHead && (
        <span
          style={{ left: `${progress * 100}%` }}
          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-primary"
        />
      )}
    </div>
  )
}
