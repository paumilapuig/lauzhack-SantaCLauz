# Spec: home-practice-modes (owner D, /home)

## Goal
At home Lucía taps any word in a saved clip to see its Spanish and save it to "Tus palabras", then practises her words in 7 varied modes.
Demo check: clip shows no pre-marked words; tap "mitochondries" -> yellow "mitocondrias", appears in "Tus palabras" as "Marcada en casa"; tap again -> gone; open "Parejas" -> pair 4 words -> end screen "Hecho" with "Sube de nivel: ..." (never %, never "x de y").

## Contract changes
None. `docs/API.md` stays untouched (owner A). Fake seam in `web/app/home/data.ts` (`shortcut:` comments). T13 adds a line to `docs/STATUS.md` "Requests to other areas": endpoint for home marks + `source` on `words_to_practice`.

## Shared decisions
- `web/app/home/types.ts`: `MyWord = WordToPractice & { source: "class" | "home" }`. UI labels: "De clase" / "Marcada en casa".
- `web/app/home/exercises/types.ts`: `PracticeWord = { lemma; translation_es; definition_fr; key_phrase }`, `ExerciseResult = { lemma: string; passed: boolean }`, `ExerciseProps = { words: PracticeWord[]; onFinish: (r: ExerciseResult[]) => void; onExit: () => void }`.
- Words with no `translate()` entry (articles, pronouns) render as plain karaoke text, not tappable. Punctuation always outside the tap target (`tokenize`).
- Every mode: one item per screen, retry on wrong answer (first-try correct = passed), end screen via `ExerciseShell`. Home calls `savePractice({lemma, clip_id, passed})` per result.
- UI per DESIGN.md §6: no boxes, hairline lists, pill buttons, 44px targets, Spanish copy, no numbers in progress.

## Tasks
**T1 Data seam + dictionary** - files: `web/app/home/data.ts`, `web/app/home/data.test.ts`, `web/app/home/types.ts`. Test first: `translate("Mitochondries")==="mitocondrias"`, `translate("les")===null`; every content word of both fake transcripts has an entry; `saveMark` adds a MyWord (source "home", key_phrase = clip sentence containing the word), `removeMark` deletes it; `getMyWords()` = 3 class words + marks. Depends: none.
**T2 Tap-to-save transcript** - files: `web/app/home/clip-transcript.tsx`, `web/app/home/clip-card.tsx`, `web/app/home/cards.test.tsx`. Props: `ClipCard({clip, saved: Set<string>, translate: (w: string) => string | null, onToggle: (word: string, translation: string) => void})`; ClipTranscript gets same `saved/translate/onToggle` + `char`. Unsaved = `Word` state "green", saved = "yellow"; karaoke bold/grey kept; waveform mark = first saved word. Test first: no `data-state="yellow"` on render; tapping a word calls onToggle with its translation; saved word renders yellow; existing audio-fallback test still passes. Depends: none (translate injected).
**T3 ExerciseShell + shuffle** - files: `web/app/home/exercises/types.ts`, `web/app/home/exercises/exercise-shell.tsx`, `web/app/home/exercises/exercise-shell.test.tsx`, `web/app/home/exercises/shuffle.ts`, `web/app/home/exercises/shuffle.test.ts`. Shell: header (mode name + "Salir"), thin segment bar (no digits), children; when `results` set shows "Hecho", "Sube de nivel: ..." (passed), "Para repasar otra vez: ..." (failed), "Volver". `shuffle(items, seed)` deterministic, never returns input order when length > 1. Test first: same seed -> same order; end screen has no digits; Salir calls onExit. Depends: none.
**T4 Tarjetas** - `exercises/flashcards.tsx`, `flashcards-logic.ts`, `flashcards.test.tsx`. FR -> tap flips -> ES + definition -> "Lo sabía"/"Aún no". Test: flip reveals ES; "Aún no" -> passed false in onFinish. Depends: T3.
**T5 Parejas** - `exercises/match-pairs.tsx`, `match-pairs-logic.ts`, `match-pairs.test.tsx`. Up to 4 FR + 4 ES columns (shuffle), wrong pair flashes and resets. Test (logic): `isPair`, board of <=4; a pair wrong once -> passed false. Depends: T3.
**T6 Dictado** - `exercises/dictation.tsx`, `dictation-logic.ts`, `dictation.test.tsx`. `speak(lemma)` -> input -> `spellingMatches` accent/case-insensitive; shows correct spelling after. Test: "dechet" matches "déchet"; speak mocked. Depends: T3.
**T7 Letras** - `exercises/unscramble.tsx`, `unscramble-logic.ts`, `unscramble.test.tsx`. Letter tiles (shuffle), tap in order, "Deshacer". Test: tiles = letters of lemma; undo returns last tile. Depends: T3.
**T8 Ordena la frase** - `exercises/order-phrase.tsx`, `order-phrase-logic.ts`, `order-phrase.test.tsx`. key_phrase words as chips, tap to rebuild. Test: chips = phrase words; correct order -> next item. Depends: T3.
**T9 ¿Verdadero o falso?** - `exercises/true-false.tsx`, `true-false-logic.ts`, `true-false.test.tsx`. FR word + own or other word's definition; "Verdadero"/"Falso". Test: deterministic item list mixes true and false; with 1 word only true items. Depends: T3.
**T10 Tus palabras list** - `web/app/home/my-words-list.tsx`, `my-words-list.test.tsx`. Hairline rows: word, ES (text-word-yellow), source tag; "Quitar" only for source "home". Test: tag text; no Quitar on class words; Quitar calls onRemove. Depends: T1.
**T11 Modes list** - `web/app/home/practice-modes-list.tsx`, `practice-modes-list.test.tsx`. Presentational `{modes: {id,name,description,icon,minWords}[], wordCount, onOpen}`: 36px `bg-primary` tile + white lucide icon, name, one line, chevron; disabled when wordCount < minWords. Test: Parejas disabled with 1 word; tap calls onOpen(id). Depends: T3.
**T12 Paso a paso adapter** - `exercises/step-by-step.tsx`, `step-by-step.test.tsx`. Runs existing `PracticeFlow` per word (unchanged) as `{...w, level: 0, clip_id: null}`; at end `onFinish([])` because PracticeFlow already saves. Test: after last word onDone -> onFinish([]). Depends: T3.
**T13 Home integration** - `web/app/home/home-review.tsx`, `web/app/home/practice-modes.ts` (registry: 7 modes, minWords 1, Parejas 2), `web/app/home/home-review.test.tsx`, `docs/STATUS.md` (Requests line), `DESIGN.md` §6 (tap-to-save, Tus palabras, Practicar list, modes). Sections "Tus clips" / "Tus palabras" / "Practicar"; open mode replaces sections, Salir returns; onFinish -> savePractice per result. Remove `word-card.tsx` usage if unused (delete file + its test case). Test: tap word in clip -> row in Tus palabras; finish a mode -> savePractice called per lemma. Depends: T1, T2, T4-T12.

## Parallel plan (max 3 per wave; no shared files inside a wave)
- Wave 1: T1, T2, T3
- Wave 2: T4, T5, T6
- Wave 3: T7, T8, T9
- Wave 4: T10, T11, T12
- Wave 5: T13
