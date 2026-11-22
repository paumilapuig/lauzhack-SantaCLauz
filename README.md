# Loop'd — French class, without a translator

**LauzHack 2026 · team SantaCLauz** (Miquel, Laura, Paula, Pau)

Loop'd helps newcomer students (*élèves allophones*) follow a live class taught in French, **without depending on a
translator**. In class the student sees live French subtitles and has two big buttons. At home she gets back the
seconds she did not understand, in her teacher's own voice, and practises only those words and ideas. The teacher
sees where the class lost her and how her autonomy grows week after week.

> Persona: **Lucía**, 14, from Valencia, 3 months in Lausanne, 11e HarmoS, French A1–A2. She was good at science in
> Spain; here she fails biology because she cannot follow spoken French.

## How it works

| Moment | Student | System |
|---|---|---|
| **Teacher prepares** (`/teacher`) | – | The teacher uploads the lesson (text, PDF, photo of the book or the board). **1 LLM call** builds a 10–20 word glossary: lemma, inflected forms, Spanish translation, simple French definition, *transparent* (Spanish cognate) or not, a sentence of the lesson. |
| **In class** (`/class`, French UI) | Live French subtitles (Web Speech API in Chrome). Two buttons: **« Je n'ai pas compris »** saves the last ~10–15 s of audio; **« J'ai perdu le fil »** saves the last 60 s of text only. **« Terminer le cours »** at the end. | **No LLM, no network per sentence.** The browser matches glossary words in the transcript and records, for each word that came up, whether this student still needs help with it (from her levels). |
| **After class** | – | Only if she pressed « J'ai perdu le fil »: **1 LLM call per session** turns those moments into up to 3 *concepts she did not follow*, each with a 3–5 step visual explanation (French + Spanish + emoji diagram) and 2–3 questions. |
| **At home** (`/home`, `/progress`) | **Clips to review**: replays each clip with karaoke text, taps the words she did not get, presses **Done**. **Practice**: 7 short games on *her* words in *her* teacher's sentences (step by step: listen → fill the gap → say it out loud). **To understand better**: the concept explanations + questions. **Progress**: positive sentences, never a percentage. | Marking a glossary word = level −1; a passed game = +1 (levels 0–3). Done on a clip = 1 small LLM call that translates the words she marked outside the glossary. Concept answers are graded without LLM. |
| **Teacher dashboard** (`/teacher/lessons/[id]`) | – | Key points, the minute where most students got lost, concepts each student struggles with (pending / to review / understood), most marked words, and **autonomy** per student = share of glossary words she followed without help, with its weekly evolution. Only the teacher sees numbers. |

## Why it is different
- **It teaches instead of translating.** Translators help today and create dependency; there is no translator in the
  exam. The help is per word and per student, and it disappears as she learns.
- **Explainable learning model, no black box.** Each (student, word) has a level 0–3: starts at 3 for Spanish
  cognates (*mitochondrie*, *oxygène*) and 0 otherwise; −1 when she marks it at home, +1 per practice passed. Same rules
  in Python (`api/app/mastery.py`) and TypeScript (`web/lib/wordState.ts`).
- **Frugal multimodal AI.** Speech recognition runs in the browser; the LLM is never called in class. Per lesson:
  1 call (glossary, also from photos/scans). Per student and class: 1 call after class only if she got lost (+1 retry only
  if the reply is unusable), and 1 tiny call per reviewed clip only if she marked words outside the glossary. Measured:
  glossary 3.5 s and $0.0008 per lesson, concepts 2–3 s and ~$0.0005 per session, translations 0.5 s and $0.00005
  (Gemini 2.5 Flash Lite via OpenRouter) ⇒ under 2 cents per lesson for a class of 25, worst case. Every AI answer is
  validated and repaired by code; transient provider errors (429/5xx) are retried twice.
- **Two learning paths, never mixed:** words (audio clip → mark → games → levels) and concepts ("I lost the thread" →
  explanation → questions → understood / to review).

## Run it
```bash
bash scripts/setup-member.sh     # tools, .env files from the templates, dependencies
bash scripts/demo-env.sh         # demo on any laptop: fills web/.env.local + api/.env, asks for the 2 secrets
npm run dev:api                  # API → http://localhost:8000/docs   (needs api/.env)
npm run dev:web                  # web → http://localhost:3000        (needs web/.env.local)
npm run test                     # Vitest (web) + pytest (api)
```
- `api/.env` (see `api/.env.example`): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENROUTER_API_KEY`,
  `OPENROUTER_MODEL` (default `google/gemini-2.5-flash-lite`), optional `OPENROUTER_VISION_MODEL`. Without the
  OpenRouter key everything works except lesson creation, concept summaries and translations of extra words.
- `scripts/demo-env.sh` never changes a value that is already set. The public values (Supabase URL, publishable key,
  `NEXT_PUBLIC_CLASS_API=http`) come from `web/.env.example`; it asks only for `SUPABASE_SECRET_KEY` and
  `OPENROUTER_API_KEY` (team chat). Secrets never go into git.
- `web/.env.local` (see `web/.env.example`): Supabase URL + publishable key, `NEXT_PUBLIC_API_URL`, and
  **`NEXT_PUBLIC_CLASS_API=http`** to use the real API. Without it the student pages run on in-browser demo data and
  show « Mode démo ».
- Demo accounts (passwords in the team chat): `prof-demo@demo.lauzhack` (teacher), `lucia-w1@demo.lauzhack`
  (week 1 profile), `lucia-w4@demo.lauzhack` (week 4 profile, prepared history). Demo lesson « La respiration
  cellulaire »: `/class?lesson=de100000-0000-4000-8000-000000000001`.
- Live class without a speaker: play `docs/demo/lesson-respiration-voice.m4a` (58 s, the « Texte à lire » of
  `docs/demo/lesson-respiration.md` read by the macOS French voice Thomas, slow, with pauses) next to the mic. Press
  « Je n'ai pas compris » at « déchets » (~35 s) and « J'ai perdu le fil » at « chaleur » (~45 s). Open
  `/class?lesson=de100000-0000-4000-8000-000000000001` so the class uses the demo lesson.
- Chrome is required in class (Web Speech API). Plan B without network: « Lire le texte de la leçon » plays the demo
  lesson as subtitles.

## Stack
`web/` Next.js 16 (App Router, TypeScript, Tailwind, shadcn/ui) · `api/` FastAPI (Python 3.12, uv) · Supabase
(Postgres + Auth + Storage, RLS) · OpenRouter (LLM) · browser Web Speech API + MediaRecorder.

## Documentation
| File | What |
|---|---|
| `docs/PLAN.md` | Product, scope, what is done, decisions log, novelty (LauzHack rule 30) |
| `docs/API.md` | Contract web ↔ api ↔ db (source of truth): endpoints, tables, rules |
| `docs/STATUS.md` | Who did what, handover, known limitations |
| `docs/demo/pitch.md` | Demo scripts per challenge (Scholé AI, IMC Tech for Good, AXA) + slide deck |
| `DESIGN.md` | Visual system |
| `docs/DEPLOY.md` | Deploy notes |
| `docs/KIT.md` | How the team's Claude Code setup was built (historical) |

## Novelty (rule 30)
Starting point: the team's starter kit (Claude Code config, Supabase login + `/api/me` + `profiles` skeleton) and
open-source libraries. **Built during the hackathon:** the whole product — per-student, per-word mastery model and
transparency detection, live subtitle tracking without LLM, audio clips from a browser ring buffer, home review with
marks and 7 games, concept path from "I lost the thread" (one LLM call per session), teacher dashboard with autonomy,
demo content.
