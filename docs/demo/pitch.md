# Pitch + demo — Loop'd (owner: Pau · revised Sun 22 Nov by Laura)

**Deck (15 slides, speaker notes in each):** https://claude.ai/artifact/5Fp6M6rjLW17YSGHVyzC9U
Private until someone shares it from the deck's Share menu; export to PDF/PPTX from there as a backup.
Old deck (Pau, "Fondu"): https://claude.ai/artifact/JM33EGe3dHLivmwLg63NX5 — the app says **Loop'd**, so the pitch does too.

Language: English (international jury). The app: `/class` in French, everything else in English.
LauzHack rule 30: say out loud what is new (slide "What we built this weekend").

## The one live demo (same for every jury, ~90 s)

**Before** (10 min earlier)
- Laptop with the API running and `OPENROUTER_API_KEY` in `api/.env` (check `http://localhost:8000/health` and create
  nothing new). `web/.env.local` has `NEXT_PUBLIC_CLASS_API=http`. Chrome, microphone allowed, a French voice
  installed (Windows: Settings › Time & language › Speech › Add voices › Français).
- Window 1 (normal): logged in as `lucia-w1` → tab A `/class?lesson=de100000-0000-4000-8000-000000000001`, tab B `/home`.
- Window 2 (**incognito**, so the login does not mix): `prof-demo` → `/teacher`, open « La respiration cellulaire ».
- Rehearsal clips of lucia-w1 are already Done, so Review starts empty: what appears is what we record live.

**Run**
1. **Class (tab A, 30 s).** « Commencer le cours ». Pau reads `docs/demo/lesson-respiration.md` calmly; subtitles run
   in French. Right after « … des **déchets** » press **« Je n'ai pas compris »** (toast « Extrait enregistré »).
   After the paragraph on **chaleur** press **« J'ai perdu le fil »** (« Moment enregistré »). Then **« Terminer le
   cours »** (« Cours terminé »): this sends the word states and starts the after-class summary (~3 s, in the background).
2. **Home (tab B, reload, 40 s).** *Clips to review*: the new clip in the teacher's voice, words light up with the audio.
   Tap **déchets** → « desecho » appears under it. **Done**. *Practice* → **Step by step** on *déchet*: listen and choose,
   fill the gap in the teacher's sentence, say it out loud → « déchet levels up ». (A second game, e.g. Pairs, makes it
   « You no longer need help with déchet »: level 0 → 2.) *To understand better*: the concept the LLM just wrote from
   « J'ai perdu le fil » — steps in French + Spanish + emoji diagram, then 2–3 questions → « understood ».
3. **Progress (10 s).** Positive sentences, never a percentage.
4. **Teacher (window 2, reload, 20 s).** *Difficult moments* (minute 12), *Concepts to review* with Lucía week 1's new
   concept, *Most marked words*, *Autonomy*: week-1 profile 53 %, week-4 profile 53 → 80 % over four weeks.
   Say: « w1 and w4 are simulated profiles with prepared history; what you just saw recorded is live. »

**Plan B**
- No speech recognition / no network: « Texte de la leçon (plan B) » next to « Son : bon » plays the demo lesson as
  subtitles; the buttons still work when the network is back (clips need Supabase).
- No new concept after 10 s: lucia-w4 has 2 prepared concepts (one understood, one to review) → show them in the
  teacher dashboard and say the call is asynchronous.
- API down: the student pages run in « Mode démo » with in-browser data (remove `NEXT_PUBLIC_CLASS_API`, restart web).

## Deck map (slide → id)
1 cover · 2 lucia · 3 problem · 4 idea · 5 demo · 6 class · 7 home · 8 concepts · 9 teacher · 10 model ·
11 frugal · 12 impact · 13 novelty · 14 next · 15 close

## Script per challenge (3 min each; skip slides not listed)

### A. Scholé AI — education ("not a chat", "how do you know they learned?")
**What they want to hear:** creative, adaptive, usable, no chatbot, and *evidence of learning*.
**Slides:** 1 · 2 · 3 · 4 · 5 (demo) · 10 · 8 · 9 · 13 · 15
- Hook (20 s): « A translator helps Lucía today. It teaches her nothing, and there is no translator in the exam. »
- Demo (90 s) as above, slowing down on *Step by step* and on the concept questions.
- Model (30 s, slide 10): knowledge tracing she can explain to a parent: a level 0–3 per word and student;
  Spanish cognates start mastered; marking a word at home −1; a game passed +1; ≥ 2 = no help. Two separate paths:
  words (lexical) and concepts (« J'ai perdu le fil »), never mixed.
- Evidence (20 s, slide 9): autonomy = glossary words she followed without help ÷ words that came up; weekly curve;
  concepts move pending → to review → understood. The student never sees a number.
- Close: « Not a chat. A teacher's voice, the student's own gaps, and help that disappears. »
- Q&A ready: *Why not a chatbot?* A 14-year-old A1 learner can't ask good questions in French; we ask the class
  instead. *Can she game it?* Games need the right answer; the honest limit (2 games → green) is on slide 14.

### B. IMC Tech for Good — charity / inclusion ("does it work, who does it help?")
**What they want to hear:** a real problem, real people, it works live, measurable impact, an NGO that could run it.
**Slides:** 1 · 2 · 3 · 12 · 4 · 5 (demo) · 9 · 14 · 13 · 15
- Hook (30 s, slides 2–3): Lucía's story. Newcomer teenagers who fail a subject *because of the language* risk being
  oriented to a less demanding school track — a decision that follows them for life.
- Impact (20 s, slide 12): who (*élèves allophones* in Swiss public schools), what changes (she follows the class
  herself), how we measure it (weekly autonomy per student, concepts understood), what it costs (≈ 1–2 cents per
  lesson for a class of 25, runs on a school laptop with Chrome).
- Demo (90 s), insisting that it is the real app with the real database, recorded live.
- Teacher (20 s, slide 9): the teacher sees *where* the class lost her and *what* to re-explain tomorrow.
- NGO: integration / schooling of migrant youth in Vaud — **[NGO name from the IMC stand]**; free for schools.
- Q&A ready: *Privacy of minors?* Audio clips stay in a private bucket, only the student and her teacher can see
  them; next step is local transcription (Whisper). *Other languages?* The glossary prompt is per language pair; Spanish
  is the first.

### C. AXA — Frugal use of Multimodal AI ("real app, own architecture, frugal, no slop")
**What they want to hear:** multimodal input, AI only where it adds value, measured cost/latency, a real web app.
**Slides:** 1 · 3 · 4 · 11 · 5 (demo) · 6 · 8 · 13 · 15
- Hook (15 s): « The obvious build is live translation with an LLM on every sentence. We call the LLM zero times in
  class. »
- Frugal (40 s, slide 11), measured on the demo lesson with Gemini 2.5 Flash Lite via OpenRouter:
  - lesson glossary from text, PDF or a **photo of the textbook**: 1 call, 3.5 s, $0.0008;
  - in class: speech-to-text in the browser, word tracking in the browser, audio clips from a browser ring buffer,
    **0 LLM calls**, 0 requests per sentence;
  - after class: 1 call per student *only if she pressed « J'ai perdu le fil »*, 2–3 s, $0.0005 (one retry only if the
    reply is unusable);
  - at home: 1 tiny call per reviewed clip *only if* she marked words outside the glossary, 0.5 s, $0.00005; games and
    answers graded without LLM.
  - ⇒ a class of 25: **under 2 cents per lesson**, worst case.
- Multimodal: voice (Web Speech API), audio (clips in the teacher's voice), text, PDF, photos/scans (vision model only
  when there are images; text model is swappable, e.g. Llama 3.3 open weights).
- No slop: every LLM output is validated and repaired by code (transparency rule = LLM proposal AND string similarity
  ≥ 0.7; concepts: unknown references dropped, emoji byte artefacts decoded, 8/8 sessions with a usable concept).
- Q&A ready: *Why not Whisper on a server?* Browser recognition is free and private enough for a demo; Whisper locally is
  the privacy next step. *Vendor lock-in?* One env var per model; OpenRouter JSON mode.

### D. Overall jury (best hack) — full deck, 4 min
All 15 slides; demo at slide 5; land on « help that disappears, word by word ».

## Before presenting (checklist)
- [ ] `api/.env` on the demo laptop has `OPENROUTER_API_KEY` (no visible error if missing!).
- [ ] `/class?lesson=de100000-0000-4000-8000-000000000001` loads the lesson; « Mode démo » badge NOT visible.
- [ ] Teacher window in incognito.
- [ ] French voice installed (karaoke + « say it » step).
- [ ] [NGO] filled on slide 12 and in script B.
- [ ] Deck shared with the team and exported to PDF.
- [ ] Three timed rehearsals.
