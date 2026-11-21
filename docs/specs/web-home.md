# Spec: web-home — student pages /home and /progress (fake data seam)

## Goal
Lucía reviews her clips and practises missed words at home (/home), and sees her progress as sentences, never % (/progress), in Spanish, on fake data copied from `docs/API.md`.
Acceptance: `/home` (no login) shows h1 "Para repasar", clip "La respiration cellulaire" with "déchets" marked yellow + "desecho", "Escuchar" speaks the transcript; "Practicar" on "déchet" runs steps 1-2-3 (wrong answer shows "Casi. Prueba otra vez."), ends with "déchet sube de nivel", "Volver" removes the word. `/progress` shows 3 messages with icons, no numbers out of a total.

## Contract changes
None. Types mirror `docs/API.md` (HomeReview, POST /api/practice, GET /api/me/progress) exactly. Do NOT create `web/lib/contract.ts` (Paula's).

## Tasks
**T1 / Types + data seam** — Files: `web/lib/student-contract.ts`, `web/app/home/data.ts`, `web/app/home/data.test.ts`
- Types: `HomeClip`, `WordToPractice`, `HomeReview`, `PracticeRequest {lemma, clip_id: string|null, passed}`, `PracticeResponse {lemma, level, leveled_up}`, `ProgressKind = "learned_this_week"|"no_help_needed"|"keep_going"`, `ProgressMessage {kind, text}`.
- data.ts: `getHomeReview()`, `savePractice(req)`, `getProgress(): Promise<{messages: ProgressMessage[]}>`, `DISTRACTORS = ["chaleur","nourriture","fournir","rejeter","essoufflé"]`. HomeReview = API.md JSON verbatim (incl. `"c1…"`, `"https://…signed…"`). Fake savePractice: in-memory level map seeded from fake words, level+1 (max 3), `leveled_up: true`. Progress texts: "Esta semana has aprendido 12 palabras nuevas", "Ya no necesitas ayuda para mitochondrie", "Sigue así: mañana repasamos déchet". Each function gets `// shortcut: fake data until owner B's endpoint exists, then swap body for request<T>()`. Wiring real API = edit this file only.
- Test first: getHomeReview returns lemma "déchet" level 0; savePractice({lemma:"déchet",clip_id:"c1…",passed:true}) → level 1, leveled_up true; getProgress has the 3 kinds. Depends: none. Size: ~90.

**T2 / Pure helpers** — Files: `web/app/home/practice-logic.ts`, `web/app/home/practice-logic.test.ts`, `web/app/home/transcript.ts`, `web/app/home/transcript.test.ts`
- `blankPhrase(keyPhrase, lemma) → {before, after, answerForm}`: first word starting with lemma (accent+case-insensitive via NFD strip); fallback lemma minus last 2 letters (`shortcut:` forms list not in HomeReview). `optionsFor(lemma, distractors)` → 3 stable options, lemma once, deterministic position. `heardMatches(heard, lemma)` accent/case-insensitive prefix check per word.
- `splitByTerms(transcript, terms) → Array<{text, lemma?}>`: segments where a word starts with a term (same normalization); unmatched terms ignored.
- Test first: blankPhrase("Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.","déchet").answerForm === "déchets"; optionsFor length 3, no dup, same output twice; heardMatches("des DECHETS","déchet") true, ("chaleur","déchet") false; splitByTerms("… elle produit aussi des déchets …",["déchet","dioxyde de carbone"]) has one segment lemma "déchet" text "déchets". Depends: none. Size: ~120.

**T3 / Speech wrappers** — Files: `web/app/home/speech.ts`, `web/app/home/speech.test.ts`
- `speak(text, rate)` (speechSynthesis, lang fr-FR, cancels previous; no-op if unsupported); `listenOnce(lang): Promise<string|null>` (SpeechRecognition ?? webkitSpeechRecognition; null when unsupported/error/no result). Not in `web/lib` (audio* is Paula's).
- Test first (jsdom): listenOnce resolves null without SpeechRecognition; speak is a no-op without speechSynthesis; with a stubbed window.speechSynthesis, utterance lang "fr-FR" and given rate. Depends: none. Size: ~60.

**T4 / ProgressMessage + StudentNav** — Files: `web/components/progress-message.tsx`, `web/components/progress-message.test.tsx`, `web/components/student-nav.tsx`
- ProgressMessage({message}): icon by kind Sprout/BadgeCheck/Footprints, 32px `text-primary` in a round `bg-accent` circle, `aria-hidden`; text in h2 size. Never %. StudentNav: links "Repasar" (/home), "Mi progreso" (/progress), `aria-current="page"` via `usePathname`.
- Test first: each kind renders its text and a distinct svg (lucide class `lucide-sprout` etc.). Depends: T1. Size: ~70.

**T5 / ClipCard + WordCard** — Files: `web/app/home/clip-card.tsx`, `web/app/home/word-card.tsx`, `web/app/home/cards.test.tsx`
- ClipCard({clip, words}): Card; lesson_title, local time (`toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})`); transcript via splitByTerms, term segments with a known translation → `Word state="yellow"` (onTap no-op), else plain text `lang="fr"`. Button "Escuchar" + Play icon: `new Audio(audio_url).play()`, on error/rejection → `speak(transcript, 0.85)`.
- WordCard({word, onPractice}): lemma big `lang="fr"`, translation_es, definition_fr muted `lang="fr"`, Button "Practicar".
- Test first (speech mocked): clip renders "desecho"; Audio play rejecting calls speak once; "Practicar" calls onPractice. Depends: T1, T2, T3. Size: ~130.

**T6 / PracticeFlow** — Files: `web/app/home/practice-flow.tsx`, `web/app/home/practice-step.tsx`, `web/app/home/practice-flow.test.tsx`
- PracticeFlow({word, onDone}): numbered steps 1-2-3, active Card `border-primary`, no timers. (1) "Escucha y elige": button speaks key_phrase rate 0.8; optionsFor(lemma, DISTRACTORS); wrong → "Casi. Prueba otra vez.". (2) "Completa la frase": blankPhrase with "____", same options. (3) "Dilo en voz alta": listenOnce("fr-FR"); match → "¡Muy bien!"; null/no match → "No te hemos oído bien, lo damos por hecho." and still passes. Then savePractice({lemma, clip_id, passed:true}) → level>=2 "Ya no necesitas ayuda para <lemma>" else "<lemma> sube de nivel"; "Volver" calls onDone(lemma). No confetti. practice-step.tsx = shared options-step UI (title, prompt, options, retry msg).
- Test first (vi.mock speech + data): wrong→retry msg→correct advances; step 2 shows "____"; listenOnce→null shows fallback and passes; savePractice called once with passed true; "Volver" calls onDone("déchet"). Depends: T1, T2, T3. Size: ~150.

**T7 / /home page** — Files: `web/app/home/page.tsx`, `web/app/home/home-review.tsx`
- page.tsx server: StudentNav + h1 "Para repasar" + `<HomeReview/>`. home-review.tsx client: loads getHomeReview; sections "Tus clips" (ClipCard each) and "Palabras para practicar" (WordCard each); selected word → PracticeFlow in place (state, no route); onDone removes word. Not added to proxy PROTECTED_PREFIXES (must work without login).
- Test first: playwright-cli at 390x844 + 768x1024: run acceptance flow, screenshot; stop dev server. Depends: T4, T5, T6. Size: ~90.

**T8 / /progress page** — Files: `web/app/progress/page.tsx`
- Server page: StudentNav + h1 "Tu progreso" + list of ProgressMessage from getProgress().
- Test first: playwright-cli: 3 messages + icons, no "%" in page text. Depends: T1, T4. Size: ~30.

**T9 / STATUS** — Files: `docs/STATUS.md`
- Pau line: /home + /progress on fake data; follow-up: add both to proxy PROTECTED_PREFIXES and swap `web/app/home/data.ts` bodies once B's endpoints exist. Depends: T7, T8. Size: ~3.

## Parallel plan
- Wave 1: T1, T2, T3
- Wave 2: T4, T5, T6
- Wave 3: T7, T8, T9 (T9 after T7/T8 land in the same wave)
