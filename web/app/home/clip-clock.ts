/** m:ss for a clip; an unknown length reads 0:00, never NaN. */
export function clock(ms: number) {
  const total = Number.isFinite(ms) ? Math.max(0, Math.round(ms / 1000)) : 0
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

/**
 * Length of a clip's audio in seconds. Chrome's MediaRecorder writes webm without a duration,
 * so the <audio> element reports Infinity: fall back to the clip window (t_end - t_start).
 */
export function audioSeconds(reported: number, clipSeconds: number) {
  return Number.isFinite(reported) && reported > 0 ? reported : clipSeconds
}
