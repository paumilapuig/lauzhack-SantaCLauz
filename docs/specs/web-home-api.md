# Spec: web-home-api — /home and /progress on the real API + "Para entender mejor" (concept path)

Owner: Pau (D), continuing on his machine the spec Laura (B) wrote (Sun 22 Nov ~03:30). Reuse the existing
components and DESIGN.md: add, don't redesign. Source: `docs/handoff/` (committed on this branch only so it travels
between machines; T7 removes it before the PR is merged) tasks T1–T8. `docs/API.md` wins on any conflict.

Backend status: every endpoint this spec calls is on `main` (PRs #33, #37, #38, #39, #43). Nothing returns 404 any more.

## Goal
Lucía's /home and /progress read and write her real data through `api.request<T>()`, and /home gets a separate
"Para entender mejor" section where she works through each concept step by step and answers its questions.
Acceptance (demo): logged out, `/home` redirects to `/login`. As `lucia-w1`, she marks and unmarks a clip word and it
stays that way after a reload. As `lucia-w4`, /home shows "Hoy no tienes clips", `déchets`/`chaleur` under "Practicar",
and one concept card "Pourquoi on a chaud pendant l'effort" tagged "Repasar". "Empezar" goes through the steps,
"Comprobar" sends her answers, and the result shows ("Casi. Vuelve a mirar la explicación" or "¡Lo has entendido!").
`/progress` shows the API's sentences (for `lucia-w4`: "Esta semana has aprendido 12 palabras nuevas"); "Aún no hay
progreso" appears only on an error. Finishing a practice that levels a word up shows a toast. No "%" anywhere.

## Contract changes
None: this is frontend only. `web/lib/student-contract.ts` copies the types in `docs/API.md` (HomeReview,
marks, practice, progress, concept answers) field for field. Not touched: `api/`, `supabase/`, `docs/API.md`,
`web/app/class/`, `web/app/teacher/`, `web/lib/api.ts`. The only edit outside Pau's area is 1 line in
`web/lib/supabase/proxy-session.ts` (T3).

## Parallel plan
| Wave | Tasks (parallel, no shared files) | Notes |
|---|---|---|
| 1 | T1, T2, T3 | T2 codes against T1's type names (below). Typecheck may fail until T1 lands; that is fine inside the wave. Vitest does not typecheck. |
| 2 | T4, T5, T6 | Only T4 edits `home-review.tsx`. T5 builds `web/app/home/concepts/*` only. |
| 3 | T7, then T8 | T8 runs after T7 is in (verification only). The orchestrator does the playwright-cli checks. |

Type names T2 uses (from T1, exact): `HomeClip`, `WordToPractice`, `ConceptStep`, `ConceptExercise`, `ConceptGap`,
`HomeReview`, `MarkResult`, `UnmarkResult`, `PracticeRequest`, `PracticeResponse`, `ProgressKind`, `ProgressMessage`,
`ProgressResponse`, `ConceptAnswersRequest`, `ConceptAnswersResponse`.

## Global rules
- Use `api.request<T>()` from `web/lib/api-client.ts`. No new `fetch`, no new libraries. Max 300 lines per file. Test first.
  Tests use Vitest + Testing Library with `// @vitest-environment jsdom`.
- Reuse what exists: Word, BigButton, Card, Dialog (`web/components/ui/dialog.tsx`), StudentPage, ProgressHero,
  ProgressMessage, `web/app/home/speech.ts`, `exercises/exercise-shell.tsx`. The 7 practice modes stay unchanged.
- DESIGN.md: motion is 200 ms ease-out, and under `prefers-reduced-motion` there are no transforms. Touch targets ≥ 44 px.
  No text < 14 px. French text gets `lang="fr"`, the Spanish UI gets `lang="es"`. Decorative icons get `aria-hidden`.
  No "%" and no "x de y" on /home or /progress.
- Trap 7 (endpoints are now on main, PR #43): the UI must still never break or block on an API error.
  Practice failures → `console.error`. Progress failures → neutral message.
- Translation (trap 5, decided): the fixed dictionary survives **only** as an explicit fallback in
  `web/app/home/demo-dictionary.ts`. It is used only when the API's `translation_es` is `null` for a marked word, and it never overrides the API.
  No translation is shown before the word is tapped (Word already shows the gloss only when `yellow` or after a tap).

## Tasks

**T1 / Contract types**. Files: `web/lib/student-contract.ts` (replace it with `docs/handoff/student-contract.ts` verbatim).
- Test first: none (types only). Run `npx tsc --noEmit` to list what breaks. Fix nothing here; T2/T4/T7 own the fixes.
- Done when the file matches `docs/handoff/02-endpoints.md` field for field. Depends: none. Size: ~60.

**T2 / Home API layer**. Files: `web/app/home/data.ts` (rewrite), `web/app/home/data.test.ts` (rewrite),
new `web/app/home/demo-dictionary.ts` + `demo-dictionary.test.ts`, new `web/app/home/to-practice-word.ts` + `to-practice-word.test.ts`.
- `data.ts` exports exactly `getHomeReview`, `markWord(clipId, word)`, `unmarkWord(clipId, word)`, `savePractice(req)`,
  `getProgress()`, `answerConcept(id, answers)` as one-liners over `api.request<T>()`, following the pattern in 02-endpoints.md › "Com cridar-los".
  It also exports `DISTRACTORS`, unchanged. Delete `FAKE_REVIEW`, `marks`, `levels`, `SEED_FORMS`, `MAX_LEVEL`, `translate`, `getMyWords`, `saveMark`, and `removeMark`.
- `demo-dictionary.ts`: move the `DICTIONARY` from current data.ts lines 69–82 here, unchanged.
  Export `demoTranslation(word: string): string | null` (lowercases the word; returns `null` when unknown, never "…").
- `to-practice-word.ts` is the one place that handles null-to-string (trap 1):
  - `practiceKey(w: WordToPractice) = w.lemma ?? w.word`.
  - `toPracticeWords(words: WordToPractice[]): PracticeWord[]` → `{ lemma: practiceKey(w), translation_es: w.translation_es ?? "",
    definition_fr: w.definition_fr ?? "", key_phrase: w.key_phrase }`, deduplicated by practice key (first one wins).
  - `practiceRequests(results: ExerciseResult[], words: WordToPractice[]): PracticeRequest[]` finds the source word by `practiceKey`
    and drops every result whose source word has `lemma === null` or is not found. The request is `{ lemma: source.lemma, clip_id: source.clip_id, passed }`.
- Test first. Mock `@/lib/api-client` with `api.request = vi.fn()` and assert that:
  - `getHomeReview` → `("/api/home/review")`
  - `markWord("c1","Déchets")` → POST `/api/clips/c1/marks` with body `{"word":"Déchets"}`
  - `unmarkWord("c1","l'oxygène")` → DELETE `/api/clips/c1/marks/l'oxyg%C3%A8ne`
  - `savePractice` → POST `/api/practice`, with the body equal to the request
  - `getProgress` → `("/api/me/progress")`
  - `answerConcept("g7",[1,0])` → POST `/api/concepts/g7/answers` with body `{"answers":[1,0]}`
  - `DISTRACTORS` is unchanged
  - `demoTranslation("Déchets")==="desechos"` and `demoTranslation("zzz")===null`
  - `toPracticeWords` on `{word:"aussi",lemma:null,…nulls}` gives `{lemma:"aussi",translation_es:"",definition_fr:""}`, and two entries with lemma "déchet" give 1 word
  - `practiceRequests` drops the "aussi" result and keeps "déchet" with its clip_id
- Depends: T1 (type names only). Size: ~150.

**T3 / Login guard**. Files: `web/lib/supabase/proxy-session.ts` (1 line only):
`PROTECTED_PREFIXES = ["/dashboard", "/home", "/progress", "/class"]`.
- Test first: playwright-cli (orchestrator). Without a session, `/home` redirects to `/login`. Depends: none. Size: 1.

**T4 / /home clips and words on real data**. Files: `web/app/home/home-review.tsx`, new `web/app/home/visit-words.ts` +
`visit-words.test.ts`, new `web/app/home/level-up-message.ts` + `level-up-message.test.ts`, `web/app/home/usable-words.ts` + `usable-words.test.ts`, `web/app/home/types.ts`,
`web/app/home/home-review.test.tsx` (rewrite), `web/app/home/cards.test.tsx` (fixture: add `kind`/`lemma` to the clip).
- `visit-words.ts` (pure; the visit's word list is the single source of marks, per trap 4). It exports:
  - `markedIn(words, clipId): Set<string>`, the set of `word` values for that clip.
  - `withPendingMark(words, clipId, word, keyPhrase)`, which prepends `{word, lemma:null, translation_es:null, definition_fr:null, key_phrase, level:null, clip_id}`.
  - `withMarkResult(words, clipId, r: MarkResult)`, which fills in `lemma`, `translation_es`, and `level` for (clipId, r.word).
  - `withoutMark(words, clipId, word)`.
  - `translationFor(words, clipId, word): string`, which returns the entry's `translation_es ?? demoTranslation(word) ?? ""`.
- `home-review.tsx`:
  - Call `getHomeReview()` once and keep `words = review.words_to_practice` as state. Never reload after a mark.
  - Tapping a word is optimistic. If `markedIn(...).has(word)`, run `withoutMark` and then `unmarkWord`. Otherwise run `withPendingMark(…, clip.transcript)`, then `markWord`,
    then `withMarkResult`. On failure, restore the previous `words` and call `console.error`.
  - Each ClipCard gets `saved=markedIn(words, clip.id)` and `translate={(w) => translationFor(words, clip.id, w)}`.
  - Practice modes get `usableWords(toPracticeWords(words), needs)`.
  - `finish(results)` runs `practiceRequests(results, words)` and calls `savePractice(r)` for each request. It never awaits and never blocks.
    Each response feeds the level-up toast (demo moment "la paraula passa a verd"): `leveled_up && level >= 2` →
    `toast("Ya no necesitas ayuda con «<lemma>»")`; `leveled_up && level < 2` → `toast("¡«<lemma>» sube de nivel!")`;
    no toast otherwise. Rejections → `console.error`, no toast. Use `toast` from `sonner` (the `<Toaster>` is already
    mounted in `web/app/layout.tsx`; the wrapper is `web/components/ui/sonner.tsx`). The toast logic lives in a pure
    helper `levelUpMessage(res: PracticeResponse): string | null` in `web/app/home/level-up-message.ts` (+ test).
  - With 0 clips, the clips section shows `<p>Hoy no tienes clips</p>` (trap 9) and "Practicar" still renders.
  - Add exactly one line at the end of the main column (after the clips section, inside the left grid cell):
    `<ConceptList concepts={review.concepts_to_learn} />` from `./concepts/concept-list`.
  - Remove the `getMyWords`/`saveMark`/`removeMark`/`translate` imports.
- `usable-words.ts` now works on `PracticeWord[]` and treats `""`/whitespace as unavailable. `types.ts`: keep `MyWord = WordToPractice`.
- Test first:
  - `visit-words.test`: a pending mark and then its MarkResult gives `markedIn` containing "déchets" with translation "desecho". `withoutMark` removes only that (clip, word) pair.
    A null API translation falls back to `demoTranslation`. An unknown word gives "".
  - `usable-words.test`: a word built by `toPracticeWords` from nulls is excluded for "translation" and does not throw.
  - `home-review.test`: mock `./data` with vi.fn, plus a stub for `./concepts/concept-list`. Assert that:
    - clicking "mitochondries" calls `markWord(clipId,"mitochondries")` and the word turns `data-state="yellow"`
    - clicking it again calls `unmarkWord`
    - a rejected `markWord` returns the word to green
    - finishing "Tarjetas" calls `savePractice` only for glossary lemmas (not for `lemma:null`)
    - a `savePractice` response `{leveled_up:true, level:2}` shows "Ya no necesitas ayuda con «déchet»"
    - `level-up-message.test`: `{true,2}` → "Ya no necesitas ayuda con «x»", `{true,1}` → "¡«x» sube de nivel!", `{false,…}` → null
    - a rejected `savePractice` still closes the flow without a crash
    - `clips: []` shows "Hoy no tienes clips"
    - `getHomeReview` is called once
- Depends: T1, T2. Size: ~150.

**T5 / Concept path UI** (handoff 04, all of it). New files, all in `web/app/home/concepts/`:
`concept-list.tsx`, `concept-card.tsx`, `concept-flow.tsx`, `concept-flow-logic.ts`, plus `concept-list.test.tsx`,
`concept-flow.test.tsx`, and `concept-flow-logic.test.ts`. Must NOT edit `home-review.tsx`.
- `ConceptList({ concepts }: { concepts: ConceptGap[] })` manages its own state, starting from the props.
  - Returns `null` when the list is empty.
  - Otherwise it renders `<section>` with h2 "Para entender mejor", the subtitle "Ideas de la clase, explicadas paso a paso.", and one ConceptCard per concept.
  - Removes a concept locally when its flow closes after `understood`.
- `ConceptCard` uses Card. It shows `concept` (`lang="fr"`), a small `lesson_title`, and a tag: "Nuevo" (pending) or "Repasar" (review).
  BigButton "Empezar" opens the ConceptFlow.
- `concept-flow-logic.ts` is a pure reducer.
  - State: `{ phase: "explain"|"questions"|"result", step, answers: (number|null)[], result, error }`.
  - Actions: next/prev/toQuestions/choose(q,i)/submitted(res)/failed/restart.
  - It also exports `canCheck` (every answer chosen).
  - `restart` goes back to step 0 and clears the answers. `failed` keeps the answers.
- `concept-flow.tsx` is a Dialog laid out like the practice modes (full screen on mobile).
  - Focus goes to the DialogTitle (the concept) on open, and Escape closes the dialog.
  - **Explain** shows one step at a time:
    - `visual` is 72–96 px, `aria-hidden`, and fades in with a slight scale over 200 ms ease-out. With `motion-reduce`, there is no transform or animation.
    - Below it, `fr` (`lang="fr"`, main text) and `es` (`lang="es"`, smaller, muted).
    - An "Escuchar" button calls `speak(fr, …)`. Step dots are `aria-hidden`, plus the visible text "Paso N".
    - "Anterior" and "Siguiente" buttons. The last step shows "Comprobar", which moves to the questions.
  - **Questions** are all on one screen. Each one is a `role="radiogroup"` labelled by its `question` (`lang="fr"`).
    Each option is a `role="radio"` button ≥ 44 px with `aria-checked`. "Comprobar" stays disabled until `canCheck`. Then it calls `answerConcept(id, answers)`.
  - **Result** is a `role="status"` region. Each question is marked "Bien" or "Repasa" from `correct[i]`, and the right option is never revealed.
    - `understood`, or `ApiError` 409: "¡Lo has entendido!" + "Cerrar" (which closes and removes the concept from the list).
    - `review`: "Casi. Vuelve a mirar la explicación" + "Ver explicación otra vez" (restart) + "Más tarde" (closes; the concept stays).
    - Network or 5xx: "No se ha podido guardar. Inténtalo otra vez" and the answers are kept.
- Copy: never "perdi", "%", "minuto", or "no entendiste" (trap 10).
- Test first. Mock `../data` (`answerConcept`) and `../speech`. Use a fixture of the lucia-w4 concept with 3 steps and 2 questions.
  - `concept-flow-logic.test`: next/prev bounds, `canCheck` false→true, restart clears the answers, and failed keeps them.
  - `concept-list.test`:
    - one card with its title and "Repasar" (status review) or "Nuevo" (pending)
    - `[]` renders nothing
    - `understood` + "Cerrar" removes the card
    - `review` keeps it and shows "Ver explicación otra vez"
    - a 409 is treated as understood
  - `concept-flow.test`:
    - "Siguiente" steps through and "Comprobar" appears on the last step
    - "Comprobar" is disabled until both questions are answered
    - `answerConcept` is called with `("g7",[1,0])`
    - a rejected 500 shows the retry text and the selections stay `aria-checked`
    - the dialog's text contains no "perdi", "%", or "minuto"
- Depends: T1, T2. Size: ~150 per file group; split the tests if a file goes over 300 lines.

**T6 / /progress on real data**. Files: `web/app/progress/page.tsx` (a server page that renders `<ProgressView />`),
new `web/app/progress/progress-view.tsx` + `progress-view.test.tsx`.
- `progress-view.tsx` (`"use client"`) calls `getProgress()` from `@/app/home/data` in `useEffect` (trap 6).
  - While loading: "Cargando…".
  - Error or 404: "Aún no hay progreso".
  - Otherwise: `ProgressHero` for `learned_this_week` if present, and the rest as a list of `ProgressMessage`, keeping the current page's markup and StudentPage props.
- Test first. Mock `@/app/home/data`. Assert that:
  - 3 messages render the hero plus 2 list items
  - without `learned_this_week` there is no hero
  - a rejection shows "Aún no hay progreso"
  - "Cargando…" appears first
  - `document.body.textContent` contains no "%"
- Depends: T1, T2. Size: ~80.

**T7 / Cleanup, leftovers, STATUS**. Files: `web/app/home/practice-flow.tsx`, `web/app/home/practice-flow.test.tsx`,
`web/app/home/exercises/step-by-step.tsx`, `web/app/home/exercises/step-by-step.test.tsx`, `web/app/home/my-words-list.tsx`,
`web/app/home/my-words-list.test.tsx`, `web/app/home/clip-card.tsx`, `web/app/home/cards.test.tsx`, `web/app/home/use-playback.ts`, `web/app/home/home-review.tsx`, `docs/STATUS.md`.
- One save point: PracticeFlow takes `word: PracticeWord`. It no longer imports `savePractice` and gets no clip_id.
  After step 3 it shows the heard message and "Volver". It drops the level-based outcome text, since the level is unknown.
  StepByStep calls `onFinish(words.map(w => ({ lemma: w.lemma, passed: true })))`, so home-review's `finish` saves (null lemmas skipped).
- `my-words-list.tsx` uses `word.word` for display and `onRemove`.
- Trap 8: `usePlayback(text, url, rate, onAudioError?)` calls `onAudioError` once in `fallBack`.
  ClipCard passes its `onAudioError` prop through. home-review reloads `getHomeReview()` once per page visit (ref guard).
- `grep -r "FAKE_REVIEW\|getMyWords\|saveMark\|removeMark" web/` returns nothing. Fix any test-fixture type errors left by `npx tsc --noEmit`.
- `docs/STATUS.md`: update ONLY the Pau (D) row. Under `## Requests to other areas`, add:
  `- Pau (D): /home i /progress connectats a l'API real + camí de conceptes a /home (spec de Laura, B), PR <n>. També 1 línia a web/lib/supabase/proxy-session.ts per protegir /home, /progress i /class (Paula: entra amb lucia-w1 abans de /class).`
- `git rm -r docs/handoff` (it was committed only to travel between machines; it must not reach main).
- Test first:
  - practice-flow.test: finishing step 3 shows "Volver" and `savePractice` is not imported or called. "Volver" calls `onDone(lemma)`.
  - step-by-step.test: finishing all words calls `onFinish` with one passed result per word.
  - cards.test: an audio play rejection calls `onAudioError` once.
- Depends: T4, T5, T6. Size: ~120.

**T8 / Verification**. Files: none (fix only what the commands flag, in files from T2–T7).
- `cd web && npm run lint && npx vitest run && npm run build` (the build uses the existing `web/.env.local`; never print it).
  All must be green. The playwright-cli captures (handoff 05 › Verificació final) are done by the orchestrator. Depends: T7.

## Out of scope
- Any API/DB change, `docs/API.md` edits, showing `lemmas` chips on concept cards,
  arrow-by-arrow animation of `visual`, the style redesign (cream/warm), and `/unslop`.
- Merging `docs/handoff/` into main (T7 deletes it).

## Risks
- `/class` becomes login-protected (the handoff asks for it). Paula's demo must log in first. This is noted in STATUS.
- Answering every lucia-w4 question correctly deletes the concept for good in the shared DB. Test with the fake `answerConcept`, not the DB.
- Between wave 1 and T7, `npm run build` fails typecheck (PracticeFlow/StepByStep/my-words-list still use the old types).
  Nothing ships before T8 is green.
- Practice and progress endpoints are live: real practices change the shared DB (levels of the demo students).
  Test level-ups with mocks; on the real DB practise only with `lucia-w1`.
