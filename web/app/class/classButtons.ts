import type { AudioClip } from "@/lib/audioRingRecorder";
import type { ClassApi } from "./classApi";
import type { SeenWords } from "./seenWords";
import type { TranscriptBuffer } from "./transcriptBuffer";

export type ButtonResult = "saved" | "failed" | "ignored";

interface ClassButtonsOptions {
  api: Pick<ClassApi, "uploadClip" | "postLost" | "endClass">;
  recorder: { clip(): Promise<AudioClip> };
  transcript: Pick<TranscriptBuffer, "textBetween">;
  seen: Pick<SeenWords, "states">;
  sessionId: string;
  nowSec: () => number;
  lostWindowSec: number;
}

export function createClassButtons(options: ClassButtonsOptions) {
  const { api, recorder, transcript, seen, sessionId, nowSec, lostWindowSec } = options;

  function guarded(action: () => Promise<void>): () => Promise<ButtonResult> {
    let inFlight = false;
    return async () => {
      if (inFlight) return "ignored";
      inFlight = true;
      try {
        await action();
        return "saved";
      } catch {
        return "failed";
      } finally {
        inFlight = false;
      }
    };
  }

  const onUnclear = guarded(async () => {
    const { blob, tStart, tEnd } = await recorder.clip();
    await api.uploadClip({ sessionId, blob, tStart, tEnd, transcript: transcript.textBetween(tStart, tEnd) });
  });

  const onLost = guarded(async () => {
    const tSec = nowSec();
    const tStart = Math.max(0, tSec - lostWindowSec);
    await api.postLost({ sessionId, tSec, tStart, transcript: transcript.textBetween(tStart, tSec) });
  });

  const onEnd = guarded(() => api.endClass(sessionId, seen.states()));

  return { onUnclear, onLost, onEnd };
}
