# Pitch + demo — Loop'd (owner: Pau · revised Sun 22 Nov by Laura)

**One deck per challenge** (speaker notes in every slide; private until shared from each deck's Share menu; export
to PDF/PPTX there as a backup):

| Challenge | Deck | Slides |
|---|---|---|
| IMC · IMCHANGE Tech for Good | https://claude.ai/artifact/TakwcTcD82FEfPS5m4kxnv | 8 |
| Scholé AI | https://claude.ai/artifact/HNZqboMNsA7H47XjKdfNQK | 8 |
| AXA · Frugal use of Multimodal AI | https://claude.ai/artifact/SHfgeioCRYoi6WDx7dkUyB | 7 |
| Overall jury (full story) | https://claude.ai/artifact/5Fp6M6rjLW17YSGHVyzC9U | 15 |

Old deck (Pau, "Fondu"): https://claude.ai/artifact/JM33EGe3dHLivmwLg63NX5 — the app says **Loop'd**, so the pitch does too.
Language: English. The app: `/class` in French, everything else in English. LauzHack rule 30: say what is new.

## Setup (10 min before any pitch)
- Laptop running the API with `OPENROUTER_API_KEY` in `api/.env` (no visible error if it is missing!) and the web with
  `NEXT_PUBLIC_CLASS_API=http`. Chrome, microphone allowed, a French voice installed (Windows: Settings › Time &
  language › Speech › Add voices › Français).
- Window 1 (normal): `lucia-w1` → tab A `/class?lesson=de100000-0000-4000-8000-000000000001`, tab B `/home`.
- Window 2 (**incognito**): `prof-demo` → `/teacher` › « La respiration cellulaire ».
- AXA only: a photo of a textbook page on the laptop (any biology page in French).
- Rehearsal clips are already Done (or **Discard**ed), so Review starts empty: what appears is what we record live.

## The core live demo (~90 s, every jury)
1. **Class (tab A).** « Commencer le cours ». Read `docs/demo/lesson-respiration.md` calmly. Right after « … des
   **déchets** » press **« Je n'ai pas compris »** (« Extrait enregistré »). After the paragraph on **chaleur** press
   **« J'ai perdu le fil »** (« Moment enregistré »). **« Terminer le cours »** (« Cours terminé ») → word states saved,
   after-class summary starts in the background (~3 s).
2. **Home (tab B, reload).** The new clip in the teacher's voice. Tap **déchets** → « desecho ». **Done** (or
   **Discard** to drop a clip). *Practice* › **Step by step** on *déchet*: listen, fill the gap in the teacher's
   sentence, say it → « déchet levels up » (a 2nd game → « You no longer need help with déchet »). *To understand
   better*: the concept written from « J'ai perdu le fil » → steps FR + ES + emoji → questions → understood / review.
3. **Teacher (window 2, reload).** Difficult moments (minute 12), Concepts to review (Lucía week 1's new concept),
   Most marked words, Autonomy (week-4 profile 53 → 60 → 73 → 80 %).
   Say: « w1 and w4 are prepared profiles; what you saw recorded is live. »

**Plan B:** no speech/network → « Lire le texte de la leçon » plays the lesson as captions (buttons need network to
save). No new concept after 10 s → show lucia-w4's two prepared concepts on the teacher dashboard. API down → remove
`NEXT_PUBLIC_CLASS_API`, restart web: « Mode démo » with in-browser data.

---

## A. IMC — IMCHANGE: Tech for Good (Learning · Inclusion)
**Their brief:** “Your code. Someone else's better day. Real problem · real charity · real demo.” Idea starter for
Inclusion: *live lecture captions*. **Judged 1–10 each on:** Technical solution (does it work?), Impact (who it helps,
and how much), Presentation (live demo). Prize goes to a charity we pick: registered non-profit, apolitical, youth /
education / inclusion.
**Deck:** cover · lucia · starter · demo · impact · works · charity · close — 3 min.

| Time | Slide | Say |
|---|---|---|
| 0:00 | cover, lucia | Lucía, 14: failing biology because of French; a failed year can decide her school track. |
| 0:25 | starter | « You suggested live lecture captions. We built them — in French — and made them teach. » |
| 0:40 | demo | Core live demo. Insist: real app, real database, recorded now. |
| 2:10 | impact | Who: newcomer pupils. How much: autonomy per pupil per week (prepared profile 53 → 80 %). Cost: Chrome + < 2 cents per lesson. |
| 2:30 | works | Does it work? You just saw it end to end; plan B offline; 460 + 244 tests. |
| 2:45 | charity | The prize goes to **Open Cultural Center** (openculturalcenter.org). |
| 2:55 | close | « Help that disappears, word by word. » |

**Charity: Open Cultural Center (OCC)** — registered non-profit active in Spain (Barcelona) and Greece (Polykastro);
mission (their words): “build bridges between communities, promoting the social and labour inclusion of migrants and
refugees.” Youth is one of their pillars; Language Lab gives free language classes to refugees and migrants; classes
for refugee children in Greece; CREATE builds language materials for migrant teenagers and unaccompanied minors.
✅ registered non-profit, ✅ youth / education / inclusion. ⚠️ Their site has no explicit political-neutrality
statement: **confirm "apolitical" with the IMC booth before presenting.** Say "the prize would go to", not "our
partner" — they have not been contacted.
**Q&A:** *Privacy of minors?* Clips live in a private bucket; only the pupil and her teacher see them; next step:
transcription on the device. *Other languages?* The glossary prompt is per language pair; Spanish → French first, OCC's
Arabic/English → Catalan classes would be a natural next pair. *How does a school start?* The teacher uploads the
lesson (text, PDF or a photo); pupils open the class page in Chrome.

## B. Scholé AI — a memorable learning experience, no chatbots
**Their brief:** pick a topic, build the most effective, creative and adaptive way to teach it — **no chatbots**; keep
a picture of the learner (background, choices, answers) and let it change what comes next. **Judged on:** Creativity,
Adaptability, Usability (someone can try it without you explaining). Their four daily questions: 01 12-year-old vs
surgeon, 02 what changes when wrong, 03 shape the lesson without a prompt, 04 learned vs just enjoyed.
**Deck:** cover · learner · demo · wrong · questions · tracing · nochat · close — 3 min.

| Time | Slide | Say |
|---|---|---|
| 0:00 | cover, learner | The context is the class she sits in. Background: Spanish L1, A1–A2; goal: follow biology alone. |
| 0:20 | demo | Core demo; slow down at home. If possible hand the laptop to a judge for the tap-the-words step (usability). |
| 1:50 | wrong | Adaptability: each action changes what comes next (table). |
| 2:10 | questions | Answer 01–04 in their numbering. 04: graded by code, and the next real class checks again. |
| 2:35 | tracing | Their own knowledge-tracing slide, our version: cognate placement, every graded activity is evidence, weak words become targets. |
| 2:50 | nochat, close | AI behind the scenes, never a chat. « The best lesson is the one you needed, right after class. » |

**Q&A:** *Uncertainty, like our Beta mastery?* Today a deterministic 0–3 level per word; a Beta posterior per word is
the natural upgrade. *Can she game it?* Games need the right answer; honest limit: two passed games make a word green.
*Same lesson for a surgeon?* Same class, different words: the lesson comes from the learner's L1 and levels.

## C. AXA — Frugal use of Multimodal AI
**Their brief:** a hack, not slides (slides score 0, web app 1, polished app 2); multimodal = text + something else,
images preferred; turning a modality into text first counts. **Judged on:** real app, anti-slop (own taste), problem,
technical challenge (not a cloned repo), **frugality**, team work, presentation (no clichéd AI phrasing).
**Deck:** cover · demo · modal · frugal · engineering · team · close — 3 min, **app first**.

| Time | Slide | Do / say |
|---|---|---|
| 0:00 | cover | One sentence, then switch to the app. |
| 0:10 | demo | **Open with Text + Image:** `/teacher` › New lesson › upload the textbook photo → glossary in ~4 s (« one call »). Then the core demo on the prepared lesson (`/class?lesson=…`, NOT the new one): « zero calls in class », « one call after class ». |
| 1:50 | modal | Each modality to text the cheapest way: speech in the browser, image → vision model once, classroom audio kept as audio. |
| 2:10 | frugal | Measured: lesson $0.0008 · class 0 · after class $0.0005 per pupil · extra words $0.00005 ⇒ < 2 cents per lesson for 25 pupils. |
| 2:30 | engineering | Built ourselves: browser audio ring buffer, live word matcher, AI output checked by code (cognate rule, concept repair, retries). |
| 2:45 | team | Who built what; 50 merged PRs (refresh the count). |
| 2:55 | close | « The cheapest AI call is the one you don't make. » |

**Q&A:** *Why not Whisper on a server?* Browser recognition costs nothing and nothing leaves the laptop during class;
local Whisper is the privacy next step. *Lock-in?* One env var per model (`OPENROUTER_MODEL`, `OPENROUTER_VISION_MODEL`);
open-weights Llama 3.3 works for the text calls. *Offline?* Captions plan B works offline; saving needs network.
*Slop?* Every number on the slides was measured; the AI proposes, code validates.
Note: the photo lesson created live stays in the database; it is harmless because `/class` always gets `?lesson=`.

## D. Overall jury (best hack) — full deck, 4 min
All 15 slides of the overall deck; demo at slide 5; land on « help that disappears, word by word ».

## Checklist
- [ ] `api/.env` on the demo laptop has `OPENROUTER_API_KEY`.
- [ ] `/class?lesson=de100000-0000-4000-8000-000000000001` loads; « Mode démo » badge NOT visible.
- [ ] Teacher window in incognito. Textbook photo on the laptop (AXA).
- [ ] French voice installed.
- [ ] OCC "apolitical" confirmed at the IMC booth.
- [ ] The four decks shared with the team and exported to PDF.
- [ ] One timed rehearsal per challenge.
