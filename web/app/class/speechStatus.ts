import type { RecognizerStatus } from "./recognizer";

export type SpeechStatus = "live" | "reconnecting" | "offline";

/** What the student sees about live subtitles: browser connection + Chrome's speech service. */
export function speechStatus({ online, recognizer }: { online: boolean; recognizer: RecognizerStatus }): SpeechStatus {
  if (!online || recognizer === "offline") return "offline";
  return recognizer === "listening" ? "live" : "reconnecting";
}
