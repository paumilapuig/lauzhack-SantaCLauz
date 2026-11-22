"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { audioSeconds } from "./clip-clock"
import { activeWordStart, timeline, type TimedWord } from "./karaoke"
import { speak } from "./speech"

const START_TIMEOUT_MS = 1500 // if a voice never fires onstart, start the clock anyway

export type Playback = {
  playing: boolean
  /** character of the transcript being spoken; null before the first play */
  char: number | null
  progress: number
  durationMs: number
  toggle: () => void
  seek: (ratio: number) => void
}

type Frame = { char: number; progress: number; done: boolean }

function lastAtOrBefore(words: TimedWord[], pick: (w: TimedWord) => number, value: number): TimedWord | undefined {
  let found: TimedWord | undefined
  for (const w of words) {
    if (pick(w) > value) break
    found = w
  }
  return found
}

// Plays the clip audio; when it cannot load, reads the transcript with the browser voice.
// Word timing: a syllable/pause timeline (karaoke.ts), started when the voice really starts and
// re-scaled on every word boundary the voice reports.
// shortcut: with real audio the timeline is stretched to the recording, until real word timestamps exist
/** `clipSeconds`: the clip window, used when the recording does not say how long it is. */
export function usePlayback(text: string, audioUrl: string, rate: number, clipSeconds = 0): Playback {
  const plan = useMemo(() => timeline(text, rate), [text, rate])
  const [playing, setPlaying] = useState(false)
  const [char, setChar] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [audioMs, setAudioMs] = useState<number | null>(null)
  const session = useRef(0)
  const frame = useRef(0)
  const audio = useRef<HTMLAudioElement | null>(null)
  const audioFailed = useRef(false)

  const ratioOf = (ms: number) => (plan.total > 0 ? ms / plan.total : 0)
  const atOf = (c: number) => lastAtOrBefore(plan.words, (w) => w.start, c)?.at ?? 0
  const wordAtTime = (t: number) => lastAtOrBefore(plan.words, (w) => w.at, t)?.start ?? 0
  const nextStart = (c: number) => plan.words.find((w) => w.start > c)?.start ?? text.length

  const halt = useCallback(() => {
    session.current++
    cancelAnimationFrame(frame.current)
    audio.current?.pause()
    globalThis.speechSynthesis?.cancel()
    setPlaying(false)
  }, [])
  useEffect(() => halt, [halt])

  function finish(id: number) {
    if (session.current !== id) return
    cancelAnimationFrame(frame.current)
    setChar(text.length)
    setProgress(1)
    setPlaying(false)
  }

  function loop(id: number, read: () => Frame) {
    const tick = () => {
      if (session.current !== id) return
      const f = read()
      if (f.done) return finish(id)
      setChar(f.char)
      setProgress(f.progress)
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  function startSpeech(id: number, from: number) {
    const base = atOf(from)
    let startedAt: number | null = null
    let scale = 1
    let heard: number | null = null
    const begin = () => {
      if (session.current === id && startedAt === null) startedAt = performance.now()
    }
    speak(text.slice(from), rate, {
      onStart: begin,
      onWord: (i) => {
        if (session.current !== id) return
        begin()
        const c = from + i
        const predicted = atOf(c) - base
        if (predicted > 300) scale = scale * 0.5 + ((performance.now() - startedAt!) / predicted) * 0.5
        heard = c
      },
      onEnd: () => finish(id),
    })
    const hasVoice = Boolean(globalThis.speechSynthesis)
    if (!hasVoice) begin()
    else setTimeout(begin, START_TIMEOUT_MS)
    loop(id, () => {
      if (startedAt === null) return { char: from, progress: ratioOf(base), done: false }
      const t = base + (performance.now() - startedAt) / scale
      let c = wordAtTime(t)
      // the voice told us where it is: never run ahead of the next word, never fall behind it
      if (heard !== null) c = Math.max(heard, Math.min(c, nextStart(heard)))
      return { char: c, progress: Math.min(1, ratioOf(t)), done: !hasVoice && t >= plan.total }
    })
  }

  function startAudio(id: number, from: number) {
    const fallBack = () => {
      audioFailed.current = true
      audio.current = null
      if (session.current === id) startSpeech(id, from)
    }
    let el: HTMLAudioElement
    let playing: Promise<void>
    try {
      el = audio.current ?? new Audio(audioUrl)
      audio.current = el
      el.addEventListener?.("ended", () => finish(id), { once: true })
      playing = el.play()
    } catch {
      return fallBack()
    }
    playing
      .then(() => {
        if (session.current !== id) return el.pause()
        const seconds = () => audioSeconds(el.duration, clipSeconds)
        if (from > 0 && seconds() > 0) el.currentTime = ratioOf(atOf(from)) * seconds()
        setAudioMs(seconds() * 1000)
        loop(id, () => {
          const p = seconds() > 0 ? Math.min(1, el.currentTime / seconds()) : 0
          return { char: wordAtTime(p * plan.total), progress: p, done: false }
        })
      })
      .catch(fallBack)
  }

  function start(from: number) {
    const id = ++session.current
    cancelAnimationFrame(frame.current)
    setChar(from)
    setProgress(ratioOf(atOf(from)))
    setPlaying(true)
    if (audioFailed.current) startSpeech(id, from)
    else startAudio(id, from)
  }

  return {
    playing,
    char,
    progress,
    durationMs: audioMs ?? plan.total,
    toggle: () => {
      if (playing) return halt()
      start(char === null || char >= text.length - 1 ? 0 : (activeWordStart(text, char) ?? 0))
    },
    seek: (ratio) => {
      const from = wordAtTime(ratio * plan.total)
      if (playing) return start(from)
      setChar(from)
      setProgress(ratioOf(atOf(from)))
    },
  }
}
