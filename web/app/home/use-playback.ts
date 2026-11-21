"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { activeWordStart, wordStartAt } from "./karaoke"
import { speak } from "./speech"

const CHARS_PER_MS = 14 / 1000 // nominal fr-FR voice at rate 1
const MAX_LEAD = 12 // never let the estimate run more than ~a word ahead of the last boundary

export type Playback = {
  playing: boolean
  /** character of the transcript being spoken; null before the first play */
  char: number | null
  progress: number
  durationMs: number
  toggle: () => void
  seek: (ratio: number) => void
}

// Plays the clip audio; when it cannot load, reads the transcript with the browser voice.
// shortcut: with real audio the spoken word is estimated linearly from currentTime, until word timings exist
export function usePlayback(text: string, audioUrl: string, rate: number): Playback {
  const [playing, setPlaying] = useState(false)
  const [char, setChar] = useState<number | null>(null)
  const [audioMs, setAudioMs] = useState<number | null>(null)
  const session = useRef(0)
  const frame = useRef(0)
  const anchor = useRef({ char: 0, at: 0 })
  const speed = useRef(CHARS_PER_MS * rate)
  const sawWord = useRef(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const audioFailed = useRef(false)
  const speechMs = text.length / (CHARS_PER_MS * rate)

  const halt = useCallback(() => {
    session.current++
    cancelAnimationFrame(frame.current)
    audio.current?.pause()
    globalThis.speechSynthesis?.cancel()
    setPlaying(false)
  }, [])
  useEffect(() => halt, [halt])

  function loop(id: number, read: () => number, done: (c: number) => boolean) {
    const tick = () => {
      if (session.current !== id) return
      const c = read()
      if (done(c)) return finish(id)
      setChar(Math.min(c, text.length - 1))
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  function finish(id: number) {
    if (session.current !== id) return
    cancelAnimationFrame(frame.current)
    setChar(text.length)
    setPlaying(false)
  }

  function startSpeech(id: number, from: number) {
    anchor.current = { char: from, at: performance.now() }
    sawWord.current = false
    speak(text.slice(from), rate, {
      onWord: (i) => {
        if (session.current !== id) return
        const now = performance.now()
        const c = from + i
        const dt = now - anchor.current.at
        if (dt > 80 && c > anchor.current.char) speed.current = speed.current * 0.6 + ((c - anchor.current.char) / dt) * 0.4
        anchor.current = { char: c, at: now }
        sawWord.current = true
      },
      onEnd: () => finish(id),
    })
    const hasVoice = Boolean(globalThis.speechSynthesis)
    loop(
      id,
      () => {
        const c = anchor.current.char + (performance.now() - anchor.current.at) * speed.current
        return sawWord.current ? Math.min(c, anchor.current.char + MAX_LEAD) : c
      },
      // with a voice, its end event finishes; without one, the estimate does
      (c) => !hasVoice && c >= text.length,
    )
  }

  function start(from: number) {
    const id = ++session.current
    cancelAnimationFrame(frame.current)
    setChar(from)
    setPlaying(true)
    if (audioFailed.current) return startSpeech(id, from)
    const el = audio.current ?? new Audio(audioUrl)
    audio.current = el
    el.onended = () => finish(id)
    el.play()
      .then(() => {
        if (session.current !== id) return el.pause()
        if (from > 0 && el.duration) el.currentTime = (from / text.length) * el.duration
        setAudioMs(el.duration * 1000)
        loop(id, () => (el.duration ? (el.currentTime / el.duration) * text.length : 0), () => false)
      })
      .catch(() => {
        audioFailed.current = true
        audio.current = null
        if (session.current === id) startSpeech(id, from)
      })
  }

  function resumeFrom() {
    return char === null || char >= text.length - 1 ? 0 : (activeWordStart(text, char) ?? 0)
  }

  return {
    playing,
    char,
    progress: char === null ? 0 : Math.min(1, char / text.length),
    durationMs: audioMs ?? speechMs,
    toggle: () => (playing ? halt() : start(resumeFrom())),
    seek: (ratio) => {
      const from = wordStartAt(text, ratio)
      if (playing) start(from)
      else setChar(from)
    },
  }
}
