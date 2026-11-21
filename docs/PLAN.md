# PLAN — "Subtítols que es retiren" (nom de treball)

> Font de veritat del QUÈ fem. El COM (endpoints, taules, JSON) és a `docs/API.md`. El QUI i QUAN, a `docs/ROLES.md`.

## Nom (l'equip en tria un a la Sincronització 1)
1. **Fondu** — els subtítols "es fonen" a mesura que aprens.
2. **Petit à petit** — l'ajuda es retira paraula a paraula.
3. **Sans sous-titres** — l'objectiu final: entendre la classe sense ajuda.

## One-liner
Ajudem alumnes nouvinguts (allophones) a entendre la classe en francès **sense dependre d'un traductor**: subtítols en francès en directe amb ajuda només a les paraules que encara no dominen, i que es retira a mesura que les aprenen.

## Persona
**Lucía**, 14 anys, de València. Fa 3 mesos que viu a Lausana per la feina dels pares i fa 11e HarmoS (últim curs obligatori) en francès. Nivell A1–A2. A València anava bé de ciències; aquí suspèn biologia perquè no entén el francès parlat del profe. Si suspèn, la poden orientar a una via menys exigent.

## Problema
Les eines que existeixen (subtítols traduïts en directe: molts projectes de hackathon i productes comercials) **tradueixen** la classe. L'ajuden avui però no l'ensenyen: continua depenent del traductor, i a l'examen no n'hi ha.

## Idea
Subtítols **en francès** de la classe en directe, amb ajuda només a les paraules que la Lucía encara no domina. Cada paraula que demostra dominar deixa de tenir ajuda. Objectiu: que entengui la classe sola.

Usuaris: **alumna** (tauleta o portàtil a classe; supòsit: autoritzat com a mesura de suport per a alumnes allophones) i **profe**.

## Features (ordre d'implementació: F1 → F2 → F4 → F3)

### F1. Subtítols que es retiren (a classe) — EL NUCLI
- La pantalla mostra el que diu el profe en francès, frase a frase.
- Cada paraula del glossari de la lliçó té un estat per a aquesta alumna:
  - 🟢 **sense ajuda** — transparent des del castellà (*photosynthèse*) o ja dominada;
  - 🟡 **amb ajuda** — la traducció castellana petita a sota;
  - 🟠 **"te la vas perdre"** — l'alumna la va tocar en una classe anterior i encara no la domina; se li recorda quan el profe la torna a dir.
- Les paraules fora del glossari es mostren sense marcar.
- NO hi ha "falsos amics" ni categoria vermella. NO traduïm frases senceres.
- Accessibilitat: cada estat té també un estil propi (subratllat, etc.), no només color. Definit a `DESIGN.md`.

### F2. Botons a classe + clip (classe → casa)
- Tocar una paraula dels subtítols = "no l'entenc" (es registra; nivell −1).
- Botó gran **"No he entès"** (no sap quina paraula): es desen els últims 30 s d'àudio + la transcripció d'aquell fragment.
- Botó **"M'he perdut"** (problema de concepte): el profe ho veu al panell.
- **A casa**: llista de clips; reescolta el clip, toca la paraula que no entenia i fa 3 activitats curtes en context real:
  1. escoltar-la al clip i identificar-la;
  2. col·locar-la en una frase del profe amb un buit;
  3. dir-la en veu alta (Web Speech API `fr-FR`; si no la reconeix bé, es dona per feta amb un avís — mai bloquejar).
  Si supera les 3, la paraula puja de nivell.

### F4. Progrés i panell del profe
- **Alumna**: MAI percentatges. Només frases positives ("Aquesta setmana has après 12 paraules noves", "Ja no necessites ajuda per a *mitochondrie*").
- **Profe**, per a cada classe: els moments (minut) amb més "M'he perdut", les paraules més tocades, i per a cada alumne nouvingut l'**autonomia** = paraules del glossari que han sortit sense ajuda ÷ total de paraules del glossari que han sortit a la classe. També l'evolució setmanal de l'autonomia.

### F3. La classe de demà, avui (NICE — només si a les 02:00 F1, F2 i F4 funcionen)
- 3 minuts a casa la nit abans: 5–8 frases clau de la lliçó de demà, àudio lent; l'alumna toca les paraules que reconeix. Al final: "Demà entendràs bona part de la classe" (sense percentatge).
- L'LLM n'extreu les frases clau en preparar la lliçó; l'àudio es genera UN COP per lliçó amb ElevenLabs (veu neutra; veu del profe només amb consentiment explícit — a la demo, la d'algú de l'equip que hi consent). Fallback: `speechSynthesis` del navegador.

## Algorisme de retirada d'ajuda (sense IA, regles explicables)
- Nivell per alumne i paraula, de 0 a 3. Inicial: **3** si és transparent des del castellà, **0** si no.
- A classe: nivell ≥ 2 → 🟢; nivell < 2 → 🟡; si la va tocar en una classe anterior i encara té nivell < 2 → 🟠.
- Tocar-la a classe → −1 (mínim 0). Superar les 3 activitats a casa → +1. Reconèixer-la a F3 → +1. Màxim 3.
- Transparència: l'LLM la marca en preparar la lliçó i `api/` la valida amb similitud de cadenes normalitzada (sense accents) entre lema francès i traducció castellana ≥ 0.7 (detall exacte a `docs/API.md`).

## Arquitectura (frugal — requisit d'AXA)
- **Preparació** (1 cop per lliçó, únic ús de l'LLM gran): el profe puja PDF/text → `api/` crida l'LLM via OpenRouter → glossari JSON (lema, formes flexionades, traducció ES, definició senzilla FR, transparent sí/no) + frases clau → Supabase.
- **A classe** (temps real, SENSE LLM): transcripció al navegador amb Web Speech API (`lang='fr-FR'`, resultats interims, Chrome) → el client carrega UNA vegada el glossari + el mapa de domini (`class-pack`) → `web/lib/wordState.ts` fa correspondre les formes flexionades i decideix l'estat. Cap crida de xarxa per frase.
- **Pla B** si Web Speech falla: àudio pregravat de la classe de demo + transcripció ja feta, reproduïts sincronitzats.
- **Clip**: MediaRecorder amb buffer circular de 30 s al navegador; en prémer el botó es puja l'àudio a Supabase Storage + el fragment de transcripció.
- **Dades**: Supabase (Postgres + Auth + Storage). Rols `student` i `teacher` a `profiles`.
- **Stack**: el del kit (web/ Next.js + Tailwind + shadcn/ui; api/ FastAPI amb uv; Supabase). Serveis externs nous: OpenRouter (LLM, clau d'AXA, 10 $/equip) i ElevenLabs (només F3).

## Challenge / track / sponsor prizes targeted
| Repte | Què demanen | Com encaixem |
|---|---|---|
| **Scholé** | creativitat, adaptabilitat, usabilitat, no xat, saber si algú ha après | subtítols diferents per alumne que canvien amb el que aprèn; domini per paraula = *knowledge tracing*; F2/F3 sense xat |
| **IMC Tech for Good** | funciona, impacte, demo en directe; per a una ONG d'educació/inclusió | joves nouvinguts en risc d'orientació a una via menys exigent; l'autonomia mesura l'impacte; Pau pregunta a l'estand d'IMC quina ONG encaixa |
| **AXA — IA multimodal frugal** | app web real, arquitectura pròpia, frugalitat, res de *slop* | entrada d'àudio; 1 crida a l'LLM per lliçó, cap en directe; reconeixement de veu al navegador |

## Demo script (90 s) — l'ÚNIC que ha de funcionar
1. **(10 s)** "La Lucía té 14 anys i fa 3 mesos que és a Lausana. Els traductors li tradueixen la classe; nosaltres li ensenyem a no necessitar-los."
2. **(25 s)** En directe: Pau llegeix en veu alta `docs/demo/lesson-respiration.md`. Els subtítols surten amb verds i grocs a la pantalla de `lucia-w1`. Toquem **"déchets"**, premem **"No he entès"** just després i **"M'he perdut"**.
3. **(20 s)** A casa: el clip, la paraula, les 3 activitats; la paraula passa a verd.
4. **(20 s)** El mateix fragment amb `lucia-w4`: el groc gairebé desapareix (i surt un 🟠) i "Aquesta setmana has après 12 paraules noves". Al panell del profe, autonomia de ~55% a 80%.
5. **(15 s)** Panell del profe: el minut on més alumnes s'han perdut. (Si hi ha F3, 10 s de "la classe de demà".) Diem al jurat que w1 i w4 són perfils simulats amb dades preparades.

## Scope
- **MUST** (camí de la demo): F1 + F2 + F4; una lliçó de biologia de demo (respiració cel·lular, `docs/demo/`); 3 usuaris de demo: `lucia-w1` (perfil setmana 1), `lucia-w4` (perfil setmana 4, mateixa lliçó, la majoria de paraules en verd), `prof-demo`.
- **NICE**: F3; deploy a Fly.io (`docs/DEPLOY.md`).
- **OUT** (ho diem al pitch com a següent pas): altres parelles de llengües, login real de menors, diverses assignatures, app nativa, transcripció local amb Whisper (opció de privacitat).

## Novelty (LauzHack rule 30)
- **Base de partida**: kit de l'equip (configs de Claude Code, agents/comandes, esquelet d'auth + DB: login Supabase, `/api/me`, taula `profiles`), llibreries open source (Next.js, shadcn/ui, FastAPI, Supabase), APIs del navegador (Web Speech, MediaRecorder) i serveis externs (OpenRouter, ElevenLabs).
- **Nou durant el hackathon**: tot el producte — model de domini per paraula i alumne amb retirada d'ajuda, detecció de transparència ES→FR, subtítols per estat en temps real sense LLM, clips de 30 s, activitats a casa, càlcul d'autonomia i panell del profe, contingut de demo.

## Owners
| Persona | Àrea (per parts del producte) | Fita actual |
|---|---|---|
| **A — Miquel** | lead: esquelet, migracions + seed, endpoints de dades de classe (class-pack, sessions, events, word-states, clips), pantalles del profe (/teacher), revisió i merge de PRs, deploy | revisar i fusionar aquest PR; migració del contracte |
| **B — Laura** | IA i dades: POST /api/lessons (LLM), transparència, algorisme de nivells, autonomia, /api/practice, /api/home/review, /api/me/progress, F3 | spike del glossari + `mastery.py` |
| **C — Paula** | classe: pàgina /class sencera (Web Speech, `wordState.ts` + tests, subtítols, botons, buffer 30 s, pujada del clip) | spike de subtítols amb Web Speech |
| **D — Pau** | casa + demo: /home i /progress, `DESIGN.md`, components base, guió i contingut de demo (`docs/demo/`), slides, estands, assajos | clau d'AXA, ONG d'IMC, `DESIGN.md` |

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
- Sat 21 — web: jsdom + @testing-library/react (devDeps) for component tests; opt in per file with `// @vitest-environment jsdom`.

## Timeline
- Sat 17:45 — PR de documentació fusionat (PLAN, API, ROLES, STATUS, demo).
- Sat 19:00 — **Sincronització 1**: esquelet + migració a main; spikes de Paula (Web Speech) i Laura (glossari) validats; decisió pla B àudio.
- Sat 22:30 — **Sincronització 2**: F1 de punta a punta amb `lucia-w1` i `lucia-w4`.
- Sun 02:00 — **Sincronització 3**: F1+F2+F4 = flux de demo sencer → decisió F3.
- Sun 08:00 — prova completa del guió; llista de bugs a STATUS.
- Sun 09:00 — **FEATURE FREEZE** → només bugs i poliment (/unslop, web-design-guidelines).
- Sun 10:30 — 3 assajos cronometrats, slides finals, text de submissió.
- Sun 11:30–11:50 — submissió. 12:00 fi.
