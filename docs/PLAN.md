# PLAN — Loop'd (abans «Subtítols que es retiren»)

> Font de veritat del QUÈ fem i de l'estat final (diumenge 22 nov). El COM (endpoints, taules, JSON) és a `docs/API.md`.
> El QUI i QUAN històric, a `docs/ROLES.md`. Guions de demo i slides: `docs/demo/pitch.md`.

## Nom
**Loop'd** és el nom que surt a l'app (logo i títol). El deck antic de Pau feia servir «Fondu»; per coherència amb el que
veu el jurat, el pitch fa servir **Loop'd**.

## One-liner
Ajudem alumnes nouvinguts (allophones) a seguir la classe en francès **sense dependre d'un traductor**: subtítols en
francès en directe, dos botons per dir «no ho he entès» i «m'he perdut», i a casa repassen només el que no van entendre,
amb la veu del seu profe, fins que ja no necessiten ajuda.

## Persona
**Lucía**, 14 anys, de València. Fa 3 mesos que viu a Lausana per la feina dels pares i fa 11e HarmoS (últim curs
obligatori) en francès. Nivell A1–A2. A València anava bé de ciències; aquí suspèn biologia perquè no entén el francès
parlat del profe. Si suspèn, la poden orientar a una via menys exigent.

## Problema
Les eines que existeixen (subtítols traduïts en directe) **tradueixen** la classe. L'ajuden avui però no l'ensenyen:
continua depenent del traductor, i a l'examen no n'hi ha.

## Idea (estat final)
- **A classe**: subtítols **en francès, text pla** (decisió d'equip, diumenge: sense colors ni traducció a la pantalla
  de classe, perquè l'alumna escolti el profe i no llegeixi castellà). El navegador sap, sense LLM, quines paraules del
  glossari han sortit i si l'alumna encara les necessitaria amb ajuda (segons el seu nivell): això és la mesura
  d'**autonomia**.
- **Dos botons**: «Je n'ai pas compris» (clip d'àudio dels últims ~10–15 s) i «J'ai perdu le fil» (només el text dels
  últims 60 s).
- **A casa**: la paraula no entesa, en la frase real i la veu real del profe; jocs curts; explicació visual dels
  conceptes on es va perdre. L'ajuda per paraula es **retira** quan la paraula arriba a nivell ≥ 2 (deixa de sortir per
  practicar i passa a «ja no necessites ajuda»).
- **Profe**: on s'ha perdut la classe, quins conceptes costen a cada alumne, paraules més marcades i autonomia setmanal.

Usuaris: **alumna** (portàtil o tauleta a classe; supòsit: autoritzat com a mesura de suport per a alumnes allophones) i
**profe**.

## Features i estat final

| | Feature | Estat |
|---|---|---|
| F0 | Preparació de la lliçó: el profe puja text / PDF / foto → glossari amb 1 crida a l'LLM | ✅ fet (`POST /api/lessons`, `/teacher`) |
| F1 | Subtítols en directe en francès + seguiment de paraules del glossari sense LLM | ✅ fet (text pla; estats calculats i desats a `word_states_log`) |
| F2 | Botons a classe → clip d'àudio / text; a casa: clips, marcar paraules, 7 jocs, conceptes | ✅ fet |
| F4 | Progrés de l'alumna (mai %) + panell del profe amb autonomia | ✅ fet |
| F3 | «La classe de demà, avui» (frases clau la nit abans) | ❌ no fet (NICE). Al pitch: següent pas |

### F1. A classe (`/class`, en francès)
- Subtítols del que diu el profe, en directe (Web Speech API `fr-FR`, Chrome). Una línia gran; interruptor
  «Sous-titres»; indicador del micro («Son : bon / faible / trop fort») i d'estat («En direct / Reconnexion… / Hors
  ligne»).
- Pla B sense xarxa: «Lire le texte de la leçon» reprodueix el text de la lliçó de demo com a subtítols.
- El client carrega UNA vegada el `class-pack` (glossari + nivells de l'alumna). `web/lib/wordState.ts` reconeix les
  formes flexionades (multi-paraula, elisions `l'`/`d'`) i guarda el primer estat de cada paraula que surt:
  `green` (nivell ≥ 2), `yellow` (< 2) o `orange` (< 2 i marcada a casa en una classe anterior).
- «Terminer le cours» envia aquests estats (`POST /word-states`) → autonomia de la sessió + resum de conceptes en
  segon pla.

### F2. Botons + casa
- **« Je n'ai pas compris »**: clip d'àudio de ~10–15 s (buffer circular de `MediaRecorder` al navegador, cada clip un
  webm vàlid) + transcripció d'aquell tros → bucket privat `clips`.
- **« J'ai perdu le fil »**: només el text dels últims 60 s, sense àudio.
- **A casa (`/home`, «Review»)**:
  - *Clips to review*: el clip amb la veu del profe i el text en karaoke; l'alumna toca les paraules que no entenia
    (paraula del glossari → −1 nivell, un cop per paraula i classe; desmarcar ho desfà) i prem **Done**. Done tradueix amb
    1 crida petita les paraules marcades que no són del glossari, perquè també es puguin practicar.
  - *Practice*: 7 jocs (Flashcards, Pairs, Dictation, Letters, Order the sentence, True or false?, Step by step =
    escoltar → completar la frase del profe → dir-la en veu alta). Cada joc superat d'una paraula del glossari = +1.
  - *To understand better*: per a cada concepte on es va perdre, explicació pas a pas (francès + castellà + diagrama
    d'emojis) i 2–3 preguntes; tot bé → «entès», si no → «a repassar» (correcció sense LLM).

### F4. Progrés i profe
- **Alumna (`/progress`)**: MAI percentatges ni «X de Y». Frases: «This week you learned N new words», «You no longer
  need help with «…»», «Keep going: tomorrow we review «…»».
- **Profe (`/teacher`, `/teacher/lessons/[id]`)**: crear lliçó (text o fitxer), Key points, Difficult moments (minuts
  amb més «J'ai perdu le fil»), Concepts to review (per alumne, amb estat i intents), Most marked words, Autonomy per
  alumne i evolució setmanal.

### F3. La classe de demà (NO FET)
Pensat: 5–8 frases clau de la lliçó la nit abans, àudio lent, l'alumna toca les paraules que reconeix (+1). El glossari
ja demana les frases clau a l'LLM, però no es desen; falten taula, `GET /api/lessons/{id}/preview` i la pàgina.

## Algorisme de nivells (sense IA, regles explicables) — `api/app/mastery.py`
- Nivell per alumna i paraula, de 0 a 3. Inicial: **3** si és transparent des del castellà, **0** si no.
- Estat: nivell ≥ 2 → 🟢 sense ajuda; < 2 → 🟡 amb ajuda; < 2 i marcada a casa abans → 🟠 «ja l'havies marcat».
- Marcar-la a casa → −1 (mínim 0), un cop per paraula i classe; desmarcar ho desfà exactament (`mark_level_changes`).
  Joc superat → +1 (màxim 3).
- Transparència: l'LLM la proposa i l'API la valida: `similitud(lema, traducció) ≥ 0.7` (difflib, sense accents).
  *libérer/liberar* 0.86 ✅, *oxygène/oxígeno* 0.71 ✅, *déchet/desecho* 0.62 ❌, *chaleur/calor* 0.67 ❌.
- Autonomia d'una sessió = paraules en 🟢 ÷ paraules del glossari que han sortit. Setmanal = mitjana per setmana ISO.

## Arquitectura (frugal)
- **Preparació** (1 crida per lliçó): text, PDF (amb text → text; escanejat → 5 pàgines com a imatges) o foto →
  OpenRouter → glossari JSON validat → Supabase. Les crides amb imatges van sempre a un model que llegeix imatges
  (`OPENROUTER_VISION_MODEL`, per defecte `google/gemini-2.5-flash-lite`).
- **A classe** (0 crides a l'LLM, 0 crides per frase): Web Speech API al navegador + `class-pack` carregat un cop.
- **Després de classe** (1 crida per sessió d'alumna, només si ha premut «J'ai perdu le fil»; 1 reintent només si la
  resposta no és utilitzable): fins a 3 conceptes amb explicació i exercicis → `concept_gaps`. La resposta de l'LLM es
  repara (`repair.py`) abans de validar-la: mesurat 8/8 sessions amb ≥ 1 concepte, ~2–3 s, ~0,0005 $.
- **A casa**: 1 crida petita per clip revisat, només si hi ha paraules marcades fora del glossari (traducció +
  definició). Les respostes i els jocs es corregeixen sense LLM.
- **Dades**: Supabase (Postgres + Auth + Storage, RLS). Rols `student` / `teacher`. L'API usa la clau secreta i aplica
  les mateixes regles al codi.
- **Model**: `OPENROUTER_MODEL` (per defecte `google/gemini-2.5-flash-lite`; qualsevol model JSON d'OpenRouter, p. ex.
  Llama 3.3 70B si es vol pes obert per al text).

## Reptes (challenges) que presentem
Enunciats oficials dels sponsors (diumenge al matí). Un deck i un guió per repte: `docs/demo/pitch.md`.

| Repte | Criteris oficials | Com hi encaixem |
|---|---|---|
| **Scholé AI** — experiència d'aprenentatge memorable | creativitat · adaptabilitat · usabilitat; **cap xatbot**; imatge de l'alumne (context, eleccions, respostes) que canvia el que ve després; les seves preguntes 01–04 | nivell per alumna i paraula (*knowledge tracing* explicable, ubicació per cognats), dos camins (paraules i conceptes), cada error canvia la pràctica següent, la IA treballa d'amagat, mai un xat |
| **IMC — IMCHANGE: Tech for Good** (Learning · Inclusion) | solució tècnica (funciona?) · impacte (a qui ajuda i quant) · presentació (demo en directe), 1–10 cadascun; premi per a una ONG registrada, apolítica, de joventut/educació/inclusió | el seu *idea starter* és «live lecture captions»; demo de punta a punta; autonomia setmanal per alumna; premi per a **Open Cultural Center** (openculturalcenter.org; cal confirmar «apolítica» a l'estand) |
| **AXA — Frugal use of Multimodal AI** | app real (slides = 0, web app = 1, app polida = 2) · anti-*slop* · problema · repte tècnic · **frugalitat** · treball en equip · presentació | text + imatge (foto del llibre) + so; cada modalitat a text de la manera més barata; 0 crides a classe; < 2 cèntims per lliçó per a 25 alumnes, mesurat |

## Scope
- **Fet (MUST)**: F0 + F1 + F2 + F4; lliçó de demo de biologia (respiració cel·lular); 3 usuaris de demo:
  `lucia-w1` (setmana 1), `lucia-w4` (setmana 4, historial preparat: autonomia 53 % → 80 %), `prof-demo`.
- **No fet**: F3; deploy públic (`docs/DEPLOY.md`).
- **OUT** (següents passos al pitch): F3, altres parelles de llengües, login real de menors, diverses assignatures, app
  nativa, transcripció local amb Whisper (privacitat), pujada automàtica del nivell de les paraules que surten sovint
  sense ser marcades.

## Limitacions conegudes (honestes)
- Una paraula groga que l'alumna mai marca no puja de nivell sola: només es practica el que es marca.
- Cada joc superat suma +1: dues rondes poden posar una paraula en verd.
- Els exercicis d'un concepte són sempre els mateixos en repetir.
- **Traduir a Context** (0 crides a l'LLM): clicar una paraula o seleccionar una frase la tradueix amb el traductor
  integrat de Chrome (`Translator`, francès → espanyol, al dispositiu; API del navegador, cap llibreria). Primer el
  glossari del concepte si té l'entrada exacta. Chrome baixa el model la primera vegada (~30 s): comença en obrir
  la pestanya Context.
- Sense `OPENROUTER_API_KEY` a la màquina de l'API no hi ha resums ni traduccions (no hi ha cap error visible).
- Cal Chrome a classe (Web Speech API) i xarxa per desar clips. Traduir a Context també necessita Chrome (138+);
  en un altre navegador surt «No translation yet» i la resta funciona.

## Novelty (LauzHack rule 30)
- **Base de partida**: kit de l'equip (configs de Claude Code, agents/comandes, esquelet d'auth + DB: login Supabase,
  `/api/me`, taula `profiles`), llibreries open source (Next.js, shadcn/ui, FastAPI, Supabase), APIs del navegador (Web
  Speech, MediaRecorder) i OpenRouter.
- **Nou durant el hackathon**: tot el producte — model de domini per paraula i alumna amb regles explicables, detecció
  de transparència ES→FR (LLM + similitud), seguiment de paraules en directe sense LLM, clips d'àudio amb buffer
  circular al navegador, revisió a casa amb marques i 7 jocs, camí de conceptes a partir de «J'ai perdu le fil» (una
  crida per sessió, amb reparació de la resposta), traducció de paraules marcades, càlcul d'autonomia i panell del
  profe, contingut de demo.

## Owners
| Persona | Àrea |
|---|---|
| **A — Miquel** | lead: esquelet, migracions + seed, dades de classe (class-pack, sessions, events, word-states, clips, marques), `/teacher`, merges |
| **B — Laura** | IA i dades: `POST /api/lessons` (LLM), transparència, nivells i autonomia (`mastery.py`), `/api/home/review`, practice, progress, conceptes (`lost_concepts`) |
| **C — Paula** | `/class` (Web Speech, `wordState.ts`, botons, buffer d'àudio) i integració de la demo |
| **D — Pau** | `/home`, `/progress`, `DESIGN.md`, demo i pitch |

## Decisions log
- Sat 17:20 — **L'esquelet ja és a `main`** (PR #1: login Supabase, `/dashboard`, `GET /api/me`, taula `profiles`, tests). Per tant, a la Fase 1 Miquel NO torna a executar `PROMPT-scaffold.md`: només ajusta el que falti i aplica la migració del contracte + usuaris de demo.
- Sat 17:20 — **"libérer" és transparent** (similitud ES 0.86 → 🟢 per a tothom), de manera que no pot "passar a verd" a la demo. La paraula que toquem a la demo és **"déchets"** (lema `déchet`, no transparent, 0.62).
- Sat 17:20 — A la demo, després de tocar la paraula premem **"No he entès"**, perquè a casa hi hagi un clip amb aquella paraula. Si una paraula tocada no té clip, a casa es fa servir la `key_phrase` amb `speechSynthesis` (vegeu API.md).
- Sat 17:20 — Transparència final = `llm_transparent AND similitud ≥ 0.7` (l'LLM proposa, la regla valida). Similitud = `difflib.SequenceMatcher(...).ratio()` sobre minúscules sense accents.
- Sat 17:20 — Si un alumne no té fila a `word_mastery` per a un lema, el nivell és l'inicial (3/0). L'API omple aquests valors al `class-pack`; el client no ha de saber-ho.
- Sat 17:20 — Una `class_session` per dispositiu d'alumna (la crea el client en començar /class). El profe no ha d'obrir la classe a la demo.
- Sat 17:20 — `POST /api/clips` també registra l'event `unclear` (una sola crida des del client).
- Sat 17:20 — Idioma de la UI: **alumna en castellà** (la seva L1), subtítols en francès; **profe en francès**. Les frases de progrés les genera l'API en castellà.
- Sat 17:20 — Glossari de demo: 15 termes, 8 transparents + 7 no transparents → autonomia inicial `lucia-w1` = 8/15 ≈ 53% ("~55%"), `lucia-w4` = 12/15 = 80%.
- Sat 17:20 — Model d'LLM configurable amb `OPENROUTER_MODEL`; Laura el tria al spike segons cost/temps mesurats.
- Sat 18:15 — Spike B fa servir **Pillow** (reduir i passar a gris les imatges abans d'enviar-les al model de visió: menys tokens). Proposta pendent de SYNC 1: imatges a `POST /api/lessons`.
- Sat 21 — **Dos tipus de clip** (`POST /api/clips`): `word` (dubte lèxic, tolerància 1–12 s, no genera cap event) i `concept` (dubte conceptual, tolerància 10–70 s, genera `unclear`). Les durades són toleràncies tècniques, no objectius de producte. `kind` per defecte `concept`; `lemma` opcional i validat contra la lliçó de la sessió (utilitat pendent de confirmar amb Laura: des del PR #22 les paraules es marquen a casa amb `clip_marks`). Àudio `audio/webm`, màx. 2 MiB. Canvi additiu: columnes `clips.kind` i `clips.lemma` (migració d'A). Els clips conceptuals es llisten sempre a `/api/home/review` (sense regla de compleció, pendent de Laura).
- Sat 21 23:00 — **"M'he perdut" = només text** dels últims 60 s, sense àudio (D4 de `docs/specs/c-class-buttons.md`): `POST /api/sessions/{id}/events` amb `context`, columnes `class_events.context_t_start`/`context_transcript`.
- Sat 21 23:00 — **Resum de "M'he perdut": 1 crida a l'LLM per lliçó després de classe** (`POST /api/teacher/lessons/{id}/lost-summary`, el profe la demana a `/teacher`), en comptes d'una per event (substitueix P3/D2 de l'spec de Paula: no hi ha `class_events.concept` ni `extract_concept`). Les crides per lliçó passen de 1 a 2 com a màxim.
- Sun 22 00:30 — **Dos camins d'aprenentatge** (substitueix la línia "Resum de M'he perdut" de Sat 21 23:00): **paraules** = "No he entès" → clip d'àudio de 10 s (`kind` per defecte `word`, tolerància 1–16 s) → marcar a casa → 3 activitats → nivells. **Conceptes** = "M'he perdut" → només text → 1 crida a l'LLM per sessió en acabar la classe (`app.lost_concepts.process_session`, B, en segon pla des de `POST /word-states`) → taula `concept_gaps` (concepte, explicació visual 3–5 passos, 2–3 exercicis) → a casa `concepts_to_learn` + `POST /api/concepts/{id}/answers` (correcció sense LLM: tot bé → `understood`, si no → `review`). El profe ho veu al Dashboard (`concept_gaps`). Desapareixen `lesson_lost_summaries` i `POST /api/teacher/lessons/{id}/lost-summary`.
- Sat 21 23:00 — **Nivells**: marcar una paraula del glossari a casa fa −1 (un cop per lema i sessió; desmarcar-la ho desfà exactament, taula `mark_level_changes`); superar les 3 activitats fa +1. `type: "word"` desapareix de `POST /events` (422).
- Sat 21 — web: jsdom + @testing-library/react (devDeps) for component tests; opt in per file with `// @vitest-environment jsdom`.

- Sun 22 — **Subtítols de classe en text pla** (sense colors ni traducció a la pantalla de classe). Els estats 🟢🟡🟠 es continuen calculant al navegador i es desen per a l'autonomia.
- Sun 22 02:20 — UI de l'alumna i del profe **en anglès** (jurat internacional); `/class` sencer **en francès** (PR #46). Inici = `/dashboard`.
- Sun 22 02:20 — **Done** per clip (`POST /api/clips/{id}/reviewed`): el clip surt de la llista; només els 5 clips pendents més nous (PR #46).
- Sun 22 03:00 — Traducció de les paraules marcades fora del glossari amb 1 crida en prémer Done (`clip_marks.translation_es/definition_fr`, PR #47).
- Sun 22 04:30 — **Model**: `google/gemini-2.5-flash-lite` per defecte (Laura). Les crides amb imatges van sempre a `OPENROUTER_VISION_MODEL` (Llama 3.3 70B, posat per defecte al #47, no llegeix imatges → fotos i PDF escanejats fallaven). Resum de conceptes: reparació de la resposta + 1 reintent només si no és utilitzable (PR #48).
- Sun 22 05:40 — OpenRouter va respondre 429 (límit temporal del proveïdor) a 3 de 6 crides seguides: totes les crides reintenten 429/502/503/504 dues vegades (1 s, 3 s). Els emojis que Gemini escriu com a bytes (`<0xF0>…`) es descodifiquen (PR #49).
- Sun 22 09:30 — **Conceptes com a diagrama, sense emojis** (Laura): la mateixa crida de després de classe (prompt v4) retorna, per a cada pas, caixes tipades (entrada · procés · resultat · lloc), fletxes amb etiqueta i traduccions de les paraules difícils. `/home` dibuixa el mapa del procés (pas actual destacat, fletxes animades, «Explore ▶»), tot en francès; tocar qualsevol paraula en dona la traducció i la desa a les paraules difícils (`POST /api/concepts/{id}/words`, taula nova `concept_word_marks`, migració aplicada) → surten a la pràctica. Cap crida extra a l'LLM; ~5 s i ~0,001 $ per sessió.
- Sun 22 04:30 — Pressupost de crides a l'LLM (final): 1 per lliçó · 0 a classe · 1 per sessió d'alumna si ha premut «J'ai perdu le fil» (+1 reintent excepcional) · 1 per clip revisat si té paraules fora del glossari.

## Timeline
- Sat 17:45 — PR de documentació fusionat (PLAN, API, ROLES, STATUS, demo).
- Sat 19:00 — Spike B afegeix **PyMuPDF** (extreure text de PDF; si és escanejat, renderitzar pàgines i enviar-les al model de visió). Nota: PyMuPDF és AGPL; per a producció valorar pypdf + pypdfium2.
- Sat 19:00 — **Sincronització 1**: esquelet + migració a main; spikes de Paula (Web Speech) i Laura (glossari) validats; decisió pla B àudio.
- Sat 22:30 — **Sincronització 2**: F1 de punta a punta amb `lucia-w1` i `lucia-w4`.
- Sun 02:00 — **Sincronització 3**: F1+F2+F4 = flux de demo sencer → decisió F3.
- Sun 08:00 — prova completa del guió; llista de bugs a STATUS.
- Sun 09:00 — **FEATURE FREEZE** → només bugs i poliment (/unslop, web-design-guidelines).
- Sun 10:30 — 3 assajos cronometrats, slides finals, text de submissió.
- Sun 11:30–11:50 — submissió. 12:00 fi.
