# Spec: /class buttons "No he entendido" + "Me he perdido" (owner C, web side only)

## Goal
On `/class`, "No he entendido" saves the last 10 s of class audio (webm) + its transcript, and "Me he perdido" saves the last 60 s of transcript for later concept extraction; both go through a `ClassApi` seam (mock now, HTTP once A/B ship).
**Demo check:** open `/class`, allow mic, speak French for 15 s, press each button → button shows "Guardado", the debug list under the buttons (mock mode) shows a new clip (playable `<audio>`, 10–15 s, matching text) and a new lost moment (60 s of text).

## Contract changes (PROPOSED — NOT implemented here; own docs/API.md PR + "Requests to other areas" line in docs/STATUS.md)
- **P1 (A, migration):** `class_events` + `context_transcript text null`, `concept text null`.
- **P2 (A, route):** `POST /api/sessions/{id}/events` with `type:"lost"` accepts optional `"context": { "t_start": real, "transcript": string }`; stores it in `context_transcript`. Response unchanged `{ "ok": true, "level": null }`.
- **P3 (B, LLM):** `extract_concept(transcript, glossary) -> str|null`, run server-side as a background task after P2 inserts the row, writes `class_events.concept`. One call per lost event; never shown to the student for now.
- **P4 (A):** `POST /api/clips` unchanged; clarify `t_end - t_start` is 10–15 s (see D1).
- **P5 (A, root config):** add `NEXT_PUBLIC_CLASS_API=mock|http` to `web/.env.example` (default `mock`).
- Typed now in `web/lib/contract.ts` (owner C) exactly as above; `mock` mode needs none of P1–P5.

### Decisions for the team (flag, do not resolve)
- **D1** Clip length 10 s (this request) vs 30 s (PLAN/DESIGN). Recorder takes `windowSec` as a param; only a constant changes.
- **D2** PLAN: "Me he perdido" = teacher flag only, no LLM in class. P3 keeps the class itself LLM-free (server, after the event) but adds 1 call per lost event, against the "1 LLM call per lesson" rule. Alternative: batch all lost contexts into the existing per-lesson call.
- **D3** Labels: BigButton (D) says "No he entendido"/"Me he perdido" (Castilian); request says Catalan. Unchanged here.
- **D4** Lost sends transcript only (LLM is text-only, frugal); no 60 s audio.

### Audio approach (chosen)
A webm stream only has its header in the first chunk, so slicing a running recording is invalid. `audioRingRecorder` runs **overlapping self-contained MediaRecorders** on one `MediaStream`: a new recorder starts every `STEP_SEC=5`; each lives `windowSec+STEP_SEC` (15 s) then is discarded (max 3 alive). `clip()` stops the oldest live recorder whose age ≥ `windowSec` (or the oldest if none, i.e. first 10 s of class) and resolves `{ blob, tStart, tEnd }` — a valid webm of 10–15 s. No new libraries.

## Tasks
**T0 / Contract proposal** — Files: `docs/API.md`, `docs/STATUS.md` (A's area: minimal, noted). Write P1–P5 + D1–D4 as a separate PR for A to approve. No test (docs). Depends: none. Size: ~30.

**T1 / Contract types + ClassApi seam** — Files: `web/lib/contract.ts`, `web/app/class/classApi.ts`, `web/app/class/classApi.test.ts`.
`interface ClassApi { startSession(lessonId); uploadClip({sessionId,blob,tStart,tEnd,transcript}); postLost({sessionId,tSec,tStart,transcript}) }`; `createMockClassApi()` (in-memory, exposes `list()` for the debug view, object URLs for blobs); `createHttpClassApi(baseUrl, getToken, fetchImpl)` building its own `FormData` request and NOT setting Content-Type (`web/lib/api.ts` forces JSON on any body — do not edit it, A's file); `getClassApi()` picks by `NEXT_PUBLIC_CLASS_API`.
Test first: http upload sends FormData with audio/session_id/t_start/t_end/transcript, Bearer token, no Content-Type header; postLost posts `{t_sec,type:"lost",lemma:null,context:{t_start,transcript}}`; non-2xx throws; mock records items returned by `list()`. Depends: none. Size: ~140.

**T2 / Rolling audio recorder** — Files: `web/lib/audioRingRecorder.ts`, `web/lib/audioRingRecorder.test.ts`.
`createAudioRingRecorder({ stream, Recorder, now, windowSec, stepSec, setInterval/clearInterval })` → `{ start(), stop(), clip(): Promise<{blob,tStart,tEnd}> }`.
Test first (fake MediaRecorder + fake clock, vitest fake timers): at t=12 s `clip()` returns blob from the recorder started at 0 (tStart 0, tEnd 12); at t=27 s returns the one started at 15 (age 12); never >3 recorders alive; expired recorders are stopped and their data dropped; `clip()` at t=3 s returns 0–3; `stop()` stops all. Depends: none. Size: ~130.

**T3 / Transcript buffer** — Files: `web/app/class/transcriptBuffer.ts`, `web/app/class/transcriptBuffer.test.ts`.
`createTranscriptBuffer({ keepSec: 90 })` → `{ add(text, tSec), textBetween(tStart, tEnd), prune(nowSec) }` over final results.
Test first: segments are joined in order with single spaces; boundaries inclusive; entries older than `keepSec` pruned; empty range → `""`. Depends: none. Size: ~60.

**T4 / Recognizer port** — Files: `web/app/class/recognizer.ts`, `web/app/class/recognizer.test.ts`. Copy `spikes/c-subtitles/src/recognizer.ts` + its test unchanged (fr-FR, auto-restart). Test first: port the spike test, must pass. Depends: none. Size: ~150.

**T5 / Buttons controller** — Files: `web/app/class/classButtons.ts`, `web/app/class/classButtons.test.ts`.
`createClassButtons({ api, recorder, transcript, sessionId, nowSec, lostWindowSec: 60 })` → `{ onUnclear(), onLost() }`, each `Promise<"saved"|"failed">`, ignores a press while the same action is in flight.
Test first (fakes for all deps): unclear → `uploadClip` with recorder's tStart/tEnd and `textBetween(tStart,tEnd)`; lost at t=100 → `postLost` with tStart 40 and `textBetween(40,100)`; lost at t=20 → tStart 0; api reject → `"failed"`; double press → one call. Depends: T1, T2, T3. Size: ~90.

**T6 / /class page** — Files: `web/app/class/page.tsx`, `web/app/class/ClassView.tsx`, `web/app/class/MockSavedList.tsx`.
"Empezar clase" button → `getUserMedia({audio:true})`, `startSession("demo-lesson")`, start recorder + recognizer (finals → buffer), live transcript line, two `BigButton`s (reuse `web/components/ui/big-button.tsx`, do not edit). On `"failed"`: `role="alert"` text "No se ha podido guardar". Mic denied / no SpeechRecognition: clear message, buttons hidden. Mock mode renders `MockSavedList` (clips with `<audio controls>` + text, lost moments with time range + text). Stop all on unmount.
Check (playwright-cli, Chrome with fake mic `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`): start, wait 12 s, press "No he entendido" → "Guardado" + one clip whose `<audio>` duration is 10–15 s; press "Me he perdido" → one lost item; screenshot. Depends: T4, T5. Size: ~150.

## Parallel plan
- **Wave 0:** T0 (docs PR; does not block web code — mock mode works without it).
- **Wave 1:** T1, T2, T3 (no shared files).
- **Wave 2:** T4, T5.
- **Wave 3:** T6.
- **Later (after A/B ship P1–P5):** set `NEXT_PUBLIC_CLASS_API=http`, rerun T6 check against the API.

## Out of scope / requests to other areas
- A: migration P1, route P2 (+ background hook for P3), P4 clarification, P5 env var, optional fix of `request()` JSON Content-Type for FormData in `web/lib/api.ts`.
- B: `extract_concept` (P3) and the D2 frugality decision.
- D: label language (D3); `BigButton` unchanged.
- Not here: subtitles/glossary help (wordState), word taps, showing concepts anywhere, using clips in /home.
