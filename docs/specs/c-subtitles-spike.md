# Spec: c-subtitles-spike (owner C, Paula)

## Goal
A standalone page in `spikes/c-subtitles/` (Vite + TS, no Next) that shows live French subtitles from Web Speech (fr-FR) with each of the 15 glossary words coloured green/yellow/orange according to a fake mastery map, a small Spanish translation under yellow words, the speech-to-text delay, and an "N/15 terms detected" counter.
**Acceptance check:** in Chrome, `cd spikes/c-subtitles && npm i && npm run dev`, then read `docs/demo/lesson-respiration.md` aloud. Words appear as you speak, "nourriture"/"déchets" show orange, "rejetons"/"dégage"/"fournit" show yellow with "expulsar"/"desprender"/"proporcionar" underneath, "glucose" is green. The latency panel shows ms values and the counter climbs towards 15/15. Recognition restarts by itself after silences. The "simulate" textbox drives the same pipeline without a mic.

## Contract changes
None. Implements the `docs/API.md` rules for state + browser matching. `src/wordState.ts` must be pure (no DOM) so it can move unchanged to `web/lib/wordState.ts`.

## Shared signatures (coders code against these exactly)
- `wordState.ts`: `type WordState = "green"|"yellow"|"orange"`; `interface LessonTermInput` (API.md shape); `interface Mastery { levels: Record<string, number>; previouslyTapped: string[] }`;
  `stateFor(term, mastery): WordState` · `matchTranscript(text, terms): Match[]` with `Match = { start; end; lemma }` (indices into the original text, sorted by start) ·
  `segment(text, terms, mastery): Segment[]` with `Segment = { text: string; lemma: string|null; state: WordState|null; translationEs: string|null }` (translation only when yellow).
- `recognizer.ts`: `createRecognizer(opts: { Ctor: SpeechRecognitionCtor; onResult(r: { finalText: string; interimText: string; at: number }): void; onSpeechStart(at: number): void; onStatus(s: "listening"|"restarting"|"stopped"|"error", detail?: string): void; now?: () => number }): { start(): void; stop(): void }`.
- `metrics.ts`: `createLatencyTracker()` → `{ markSpeechStart(at); markResult(at, isFinal): { firstTextMs: number|null; finalMs: number|null }; medianFirstTextMs(): number|null }` · `createDetectionCounter(lemmas: string[])` → `{ add(lemmas: string[]): void; detected(): Set<string>; label(): string /* "7/15" */ }`.
- `render.ts`: `renderSegments(segments: Segment[]): string` (HTML string, all text escaped).

## Tasks
**T1 Scaffold** — Files: `spikes/c-subtitles/package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `README.md`. devDeps only `vite`, `vitest`, `typescript` (same majors as `web/`; justification: serve TS in browser + run tests, nothing else). Scripts `dev`, `test`, `typecheck`. Strict tsconfig, `resolveJsonModule`, lib `DOM`. `vite.config.ts`: `server.fs.allow: ["../.."]` (to import `docs/demo/glossary-respiration.json`), vitest env `node`, include `src/**/*.test.ts`. README: run steps, Chrome/Edge only, mic permission, simulate box. Do not commit root `package-lock.json`.
Test first: `src/smoke.test.ts` asserting `1+1===2`, deleted once `npm test` passes. Depends: none. Size: ~60.

**T2 Matcher + state rule** — Files: `spikes/c-subtitles/src/wordState.ts`, `src/wordState.test.ts`.
Rules: lowercase with `toLocaleLowerCase("fr")`; build all (form, lemma) pairs, sort by form length desc; match with Unicode boundaries `(?<![\p{L}\p{N}])form(?![\p{L}\p{N}])` (flags `giu`, form regex-escaped; `\b` is forbidden, it breaks on accents); skip candidates overlapping an earlier match. Elisions `l'`, `d'`, `l’`, `d’` stay outside the match. `stateFor`: level = `levels[lemma]` ?? (3 if transparent else 0); `>=2` green; `<2` and tapped orange; else yellow.
Test first (vitest, real glossary JSON + fake mastery inline): `"d'énergie"` → match covers `énergie` only; `"l’oxygène"` same with curly apostrophe; `"respiration cellulaire"` → one match; synthetic terms `carbone` + `dioxyde de carbone` → only the long one; `"cellulaire"` alone → no `cellule` match; `"énergies"` → form `énergies`; `"nous les rejetons"` → `rejeter`; `"L'Énergie"` keeps original casing in `Segment.text`; stateFor covers the green-by-default (transparent, no row), yellow, orange and level-2 cases; `segment` concatenated texts === input. Depends: T1. Size: ~140.

**T3 Recognizer with auto-restart** — Files: `spikes/c-subtitles/src/recognizer.ts`, `src/recognizer.test.ts`.
Sets `lang="fr-FR"`, `continuous=true`, `interimResults=true`. `onresult`: concatenate finals from `resultIndex` into `finalText`, rest into `interimText`. `onend`: if not stopped by `stop()`, status `restarting` and call `start()` again (catch `InvalidStateError`, retry after 250 ms). `onerror`: `no-speech`/`aborted`/`network` → let `onend` restart; `not-allowed`/`service-not-allowed` → status `error`, no restart.
Test first: a `FakeRecognition` class in the test; asserts config flags, restart after `onend`, no restart after `stop()`, no restart after `not-allowed`, final/interim split from a fake results list. Depends: T1. Size: ~130.

**T4 Latency + detection counter** — Files: `spikes/c-subtitles/src/metrics.ts`, `src/metrics.test.ts`.
Utterance = from `markSpeechStart` (Web Speech `speechstart`, or Space key pressed by the speaker) until the first final result. `firstTextMs` = first result − start (once per utterance); `finalMs` = final − start; after a final, the next result with no new start uses the previous final time as start. Median over the last 20 `firstTextMs`.
Test first: fixed timestamps → expected ms; null before any start; median of [100,300,200] = 200; counter ignores unknown lemmas and duplicates, `label()` "2/15". Depends: T1. Size: ~100.

**T5 Render + fake mastery** — Files: `spikes/c-subtitles/src/render.ts`, `src/render.test.ts`, `src/fakeMastery.ts`.
Term → `<span class="term term--{state}" data-lemma>`; yellow adds `<small class="tr">{translationEs}</small>` underneath (inline-flex column); plain text escaped. `fakeMastery.ts` exports a `Mastery`: `nourriture`:1 + `déchet`:0 tapped (orange); `rejeter`,`dégager`,`fournir`,`chaleur`,`essoufflé`:0 and `mitochondrie`:1, not tapped (yellow); all others no row (green when transparent).
Test first: `<script>` in text is escaped; yellow segment contains its translation; green/orange don't; class names per state. Depends: T2. Size: ~90.

**T6 Page wiring** — Files: `spikes/c-subtitles/index.html`, `src/main.ts`, `src/style.css`, `docs/STATUS.md` (Paula's line only).
Imports the glossary JSON + `fakeMastery`; Start/Stop button; status pill; subtitle area = last 3 final lines + interim line (greyed), each rendered via `segment`→`renderSegments`; latency panel (last first-text ms, last final ms, median); counter `N/15` + the 15 lemmas with a tick when detected (from interim and final); Space key → `markSpeechStart`; "Simulate transcript" textbox feeding the same handler as a final result; banner if `SpeechRecognition`/`webkitSpeechRecognition` missing. `main.ts` only wires; no logic beyond glue. Large readable subtitle type per `DESIGN.md`.
Check (playwright-cli): open `http://localhost:5173`, screenshot shows `0/15`; type "Les mitochondries utilisent l'oxygène et rejettent des déchets" in the simulate box → spans `term--yellow` (with "expulsar", "mitocondria"), `term--orange` (déchets), `term--green` (oxygène), counter `4/15`. Manual mic test in Chrome by Paula. Depends: T2, T3, T4, T5. Size: ~150.

## Parallel plan
- Wave 1: T1
- Wave 2: T2, T3, T4 (disjoint files)
- Wave 3: T5
- Wave 4: T6, then reviewer, then `/ship` (branch `feat/class-subtitles-spike`)
