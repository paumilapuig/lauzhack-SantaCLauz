export type SubtitleLines = { finals: string[]; interim: string };

export const EMPTY_SUBTITLES: SubtitleLines = { finals: [], interim: "" };

const MAX_FINAL_LINES = 3;

/** Rolling subtitle view: last finished sentences plus the sentence being spoken now. */
export function addResult(
  state: SubtitleLines,
  result: { finalText: string; interimText: string },
): SubtitleLines {
  const finalText = result.finalText.trim();
  const interimText = result.interimText.trim();
  if (finalText) return { finals: [...state.finals, finalText].slice(-MAX_FINAL_LINES), interim: "" };
  if (interimText) return { finals: state.finals, interim: interimText };
  return state;
}
