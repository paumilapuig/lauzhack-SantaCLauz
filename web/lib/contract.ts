// Class-side contract (docs/API.md + proposed P1/P2 in docs/specs/c-class-buttons.md).
export type ClipUpload = {
  sessionId: string;
  blob: Blob;
  tStart: number;
  tEnd: number;
  transcript: string;
};

export type LostMoment = {
  sessionId: string;
  tSec: number;
  tStart: number;
  transcript: string;
};

export type LostEventRequest = {
  t_sec: number;
  type: "lost";
  lemma: null;
  context: { t_start: number; transcript: string };
};

export type StartSessionResponse = { session_id: string };
