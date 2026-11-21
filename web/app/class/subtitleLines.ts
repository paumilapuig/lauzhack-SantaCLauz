export type SubtitleLines = { finals: string[]; interim: string; lastAt: number };

export const EMPTY_SUBTITLES: SubtitleLines = { finals: [], interim: "", lastAt: Number.NEGATIVE_INFINITY };

const MAX_FINAL_LINES = 3;
export const SUBTITLE_IDLE_SEC = 4;

/** Rolling subtitle state; a silence longer than SUBTITLE_IDLE_SEC starts a fresh line. */
export function addResult(
  state: SubtitleLines,
  result: { finalText: string; interimText: string; at: number },
): SubtitleLines {
  const finalText = result.finalText.trim();
  const interimText = result.interimText.trim();
  if (!finalText && !interimText) return state;
  const finals = result.at - state.lastAt > SUBTITLE_IDLE_SEC ? [] : state.finals;
  if (finalText) return { finals: [...finals, finalText].slice(-MAX_FINAL_LINES), interim: "", lastAt: result.at };
  return { finals, interim: interimText, lastAt: result.at };
}

export function lineText(state: SubtitleLines): string {
  return [...state.finals, state.interim].filter(Boolean).join(" ");
}
