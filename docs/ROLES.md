# ROLES — qui fa què i quan (dissabte 21/11 17:20 → diumenge 22/11 12:00)

> Llegeix primer `docs/PLAN.md` (què fem) i `docs/API.md` (contracte). Aquest fitxer diu **qui, quan i com**.
> Repartim per **parts del producte de punta a punta**, no per capes.

| Persona | Part del producte | Carpetes que són seves |
|---|---|---|
| **Miquel (A)** | lead + profe: esquelet, migracions i seed, dades de classe, pantalles del profe, merges, deploy | `supabase/`, `docs/` (excepte `docs/demo/`), arrel, `web/app/teacher/`, `api/app/routers/classdata*`, `api/app/routers/teacher*` |
| **Laura (B)** | IA i dades: lliçó amb l'LLM, transparència, nivells, autonomia, pràctica, progrés, F3 | `api/app/` (la resta: lessons, mastery, practice, progress, preview), `api/tests/`, `spikes/b-glossary/` |
| **Paula (C)** | classe: pàgina /class sencera | `web/app/class/`, `web/lib/wordState*`, `web/lib/audio*`, `web/lib/contract.ts`, `spikes/c-subtitles/` |
| **Pau (D)** | casa + demo: /home, /progress, disseny, demo, pitch | `web/app/home/`, `web/app/progress/`, `web/components/`, `DESIGN.md`, `docs/demo/` |

---

## Regles per a tothom (llegiu-les en veu alta)
1. **Mai treballar a `main`.** Una branca per tasca: `feat/<area>-<cosa>` o `fix/<area>-<cosa>`.
2. **PRs petits** (< ~300 línies), cada ~60–90 min. Només **Miquel** fusiona.
3. **Contracte primer**: si cal canviar un endpoint o una taula, primer un PR que només toqui `docs/API.md`, i avisar al xat.
4. **Només Miquel fa migracions.** Si et cal una columna, escriu-ho a `docs/STATUS.md` › "Requests" i al xat.
5. Abans de cada tasca: **`/sync <àrea>`**. En acabar: **`/ship`** i actualitzar la teva línia de `docs/STATUS.md`.
6. **`/clear` entre tasques** (context net = menys errors i menys límit gastat).
7. **Sonnet per defecte**, Opus només per planificar (el `planner` ja ho fa sol).
8. Màxim **2 agents alhora** per persona. Si la barra **5h** de l'statusline passa del **70%**, avisa al xat.
9. Mai llegir ni enganxar `.env`. Les claus van pel xat privat.
10. Tocar una carpeta d'una altra persona: mínim, i anotar-ho a `docs/STATUS.md`.

---

## Configurar Orca (tothom, 10 min, Fase 0)
Orca és una app que obre **diversos agents de Claude Code en paral·lel**, cadascun en el seu **worktree** (una còpia de treball del repo en una carpeta separada, amb la seva branca). Així pots tenir dos agents fent dues tasques sense trepitjar-se. Els noms exactes dels botons poden variar segons la versió: busca l'opció equivalent.

1. **Prerequisits**: ja has fet `git clone` del repo i `bash scripts/setup-member.sh`; `claude` funciona al terminal i hi has entrat amb Claude Pro. Has omplert `web/.env.local` i `api/.env` amb els valors del xat privat.
2. **Obrir Orca** → a l'assistent d'inici, tria **Claude Code** com a agent (fa servir el `claude` que ja tens instal·lat i loguejat).
3. **Afegir el repo**: opció tipus *Add repository* / *Open folder* → tria la carpeta on vas fer `git clone`. Si ofereix connectar GitHub, accepta.
4. Apunta't la **ruta del repo original** (al terminal, dins la carpeta clonada: `pwd`). La necessitaràs a cada worktree.
5. Comprova a Claude Code: `/skills` (han de sortir `feature`, `ship`, `sync`, `playwright-cli`, `unslop`…) i `/plugin` (superpowers activat).

## Flux per a CADA tasca amb Orca (pas a pas)
1. A Orca: **New worktree** → nom de branca segons la tasca (p. ex. `feat/web-class-subtitles`). Orca crea una carpeta nova amb aquesta branca.
2. Al **terminal del worktree**, ABANS de res (els secrets no són a git):
   ```bash
   pwd                                   # per saber on ets
   cp <ruta-repo-original>/web/.env.local web/
   cp <ruta-repo-original>/api/.env api/
   (cd web && npm install) ; (cd api && uv sync)
   ```
3. Obre l'agent: `claude`.
4. `/sync <àrea>` (A, B, C o D) → et resumeix què ha canviat.
5. `/feature <tasca>` (copia el text de la teva tasca d'aquest fitxer) → l'agent explora i escriu una especificació a `docs/specs/<slug>.md`.
6. **Revisa l'especificació** (Goal, Contract changes, Parallel plan). Si toca el contracte i no ets Miquel → atura't i parla-ho al xat. Si està bé → respon `ok`.
7. Quan acabi: **revisa el diff a Orca** (pestanya de canvis). Si veus fitxers fora de la teva carpeta, pregunta per què.
8. `/ship` → fa lint/tests, commit, push i obre el PR. Enganxa l'URL del PR al xat i avisa **Miquel**.
9. Quan Miquel l'hagi fusionat: **tanca el worktree** a Orca. Següent tasca → torna al pas 1.

**Pla B sense Orca**:
```bash
git worktree add ../wt-<tasca> -b feat/<area>-<tasca>
cd ../wt-<tasca>   # copia els .env com al pas 2 i instal·la
claude
```
Per tancar-lo: `git worktree remove ../wt-<tasca>`.

---

## Cronograma general
| Hora | Fase | Miquel (A) | Laura (B) | Paula (C) | Pau (D) |
|---|---|---|---|---|---|
| 17:20–17:45 | 0 Preparació | revisa i fusiona PR de docs | setup + Orca | setup + Orca | estands AXA (clau) i IMC (ONG) |
| 17:45–19:00 | 1 Esquelet + spikes | migració contracte + usuaris demo | spike glossari + `mastery.py` | spike subtítols Web Speech | DESIGN.md, revisar demo, esbossos |
| **19:00** | **SYNC 1** (10 min) | | | | |
| 19:10–22:30 | 2 F1 punta a punta | class-pack, sessions, events, word-states, seed | POST /api/lessons, mastery a api/ | /class + wordState.ts | components base → /home, /progress (fake) |
| **22:30** | **SYNC 2** | | | | |
| 22:30–02:00 | 3 F2 + F4 | clips, /teacher, dashboard | review, practice, progress, autonomia | buffer 30 s, botons, pujada clip | /home connectat, /progress, QA, slides |
| **02:00** | **SYNC 3** (F3?) | | | | |
| 02:00–05:00 | 4 | **dorm** | F3 o bugs | F3 o bugs | **dorm** |
| 05:00–08:00 | 4 | deploy / demo local, dades netes | **dorm** | **dorm** | slides, dades demo |
| 08:00–09:00 | prova | prova del guió sencer, bugs a STATUS | ← | ← | ← |
| **09:00** | **FREEZE** | | | | |
| 09:00–10:30 | poliment | bugs, dades, pla B àudio | bugs, dades, pla B àudio | /unslop + web-design-guidelines | /unslop + web-design-guidelines, vídeo |
| 10:30–11:30 | assaig | 3 assajos cronometrats | text submissió + Novelty | assajos | slides finals, assajos |
| 11:30–11:50 | submissió | només Miquel fusiona arreglos crítics | | | |

Sopar per torns (20 min cadascú) sense aturar la feina. **Mai menys de 2 persones despertes.**

## Punts de sincronització
- **19:00 — SYNC 1** (10 min): l'esquelet + migració és a `main`? El spike de Paula funciona (latència, qualitat)? El de Laura genera un glossari vàlid? Si Web Speech no va bé → **pla B (àudio pregravat) decidit ara**. Triem nom (PLAN.md).
- **22:30 — SYNC 2**: F1 funciona de punta a punta amb `lucia-w1` i `lucia-w4`? Si no → **tothom ajuda a F1**; F2 i F4 esperen.
- **02:00 — SYNC 3**: F1+F2+F4 fan el flux de demo sencer? Sí → Laura i Paula fan F3 fins a les 05:00. No → tothom arregla el flux principal.

---

## Miquel (A) — lead + profe

### 17:20–17:45 · Fase 0
- Revisar aquest PR (`docs: project definition, contract, roles`) amb l'equip en pantalla i **fusionar-lo**.
- Configurar Orca (secció de dalt).
- **Fet quan**: `main` té `docs/PLAN.md`, `docs/API.md`, `docs/ROLES.md`, `docs/demo/`.

### 17:45–19:00 · Fase 1 — esquelet + migració (PRIORITAT ABSOLUTA, bloqueja tothom)
L'esquelet (login, `/dashboard`, `GET /api/me`, `profiles`) **ja és a `main`** (PR #1). No cal tornar a executar `PROMPT-scaffold.md`.
- Branca `feat/db-contract-tables`. `/feature` amb: *"Migració amb totes les taules i columnes de docs/API.md (profiles.role/l1/level, lessons, lesson_terms, word_mastery, class_sessions, class_events, clips, word_states_log, practice_results), RLS segons la taula, grants a authenticated/service_role com a la migració de profiles, bucket privat 'clips'. Ampliar GET /api/me amb display_name i role."*
- Fitxers: `supabase/migrations/<timestamp>_contract.sql`, `web/lib/database.types.ts` (generat), `api/app/schemas.py` (Me).
- Crear els 3 usuaris de demo (`prof-demo`, `lucia-w1`, `lucia-w4` @demo.lauzhack) al dashboard de Supabase i posar `role='teacher'` a prof-demo. Contrasenya al xat privat.
- **Com provar**: `npx supabase db push`; `npx supabase gen types …`; `uv run pytest`; login amb `lucia-w1` → `/api/me` retorna `role: "student"`.
- **Fet quan**: migració aplicada al projecte compartit, tipus regenerats, PR fusionat abans de les 19:00.

### 19:10–22:30 · Fase 2 — dades de classe (F1)
1. Branca `feat/api-classdata`: `GET /api/lessons`, `GET /api/lessons/{id}/class-pack`, `POST /api/sessions`, `POST /api/sessions/{id}/events`, `POST /api/sessions/{id}/word-states`, exactament com API.md. Fitxers: `api/app/routers/classdata.py` (+ `classdata_*.py` si passa de 300 línies), registre a `api/app/main.py`, `api/tests/test_classdata*.py`. Fa servir `api/app/mastery.py` de Laura (nivell per defecte, −1, autonomia). Si encara no hi és, Laura et passa les signatures a la SYNC 1 i tu fas servir un stub mínim.
2. Branca `feat/db-demo-seed`: seed de la lliçó de demo (els 15 termes de `docs/demo/glossary-respiration.json`) i els perfils `lucia-w1`/`lucia-w4` tal com diu API.md › Demo seed. Fitxers: `supabase/seed.sql` o `supabase/seed_demo.sql` (sense secrets).
3. Revisar i fusionar PRs cada ~hora (`gh pr list`, `gh pr diff <n>`, `gh pr merge <n> --squash`).
- **Com provar**: pytest per a cada endpoint (200 + 401 + 403 de rol); amb el token de `lucia-w4`, el class-pack retorna `mastery.nourriture = 3` i `previously_tapped` conté `chaleur`.
- **Fet quan**: Paula pot carregar el class-pack real des de /class.

### 22:30–02:00 · Fase 3 — clips + panell del profe (F2, F4)
1. Branca `feat/api-clips`: `POST /api/clips` (multipart → Storage `clips/{student_id}/{clip_id}.webm`, fila a `clips`, event `unclear`). Fitxers: `api/app/routers/classdata_clips.py`, test.
2. Branca `feat/api-teacher-dashboard`: `GET /api/teacher/lessons/{id}/dashboard` amb `mastery.autonomy` de Laura. Fitxers: `api/app/routers/teacher.py`, test.
3. Branca `feat/web-teacher`: `/teacher` — llista de lliçons, formulari "pujar lliçó" (crida `POST /api/lessons` de Laura) i panell: gràfic de barres de `lost_peaks` per minut, llista `top_words`, taula d'alumnes amb autonomia i evolució setmanal. Fitxers: `web/app/teacher/**`. UI en francès. Components de `web/components/` de Pau.
4. Dades setmanals simulades per a la demo (sessions antigues de `lucia-w4`) dins el seed.
- **Com provar**: playwright-cli amb `prof-demo` → screenshot del panell amb el pic al minut 12 i `lucia-w4` 80%.

### 02:00–05:00 · dorm. 05:00–08:00
- Deploy a Fly.io (`docs/DEPLOY.md`) **només si** la demo local ja és estable; si no, deixar la demo funcionant en local en UN portàtil (el de la presentació). Dades de demo netes (script per reiniciar les dades dels usuaris demo — mai `db reset`).

### 08:00–12:00
- 08:00 prova del guió. 09:00–10:30 bugs, dades, pla B àudio provat. 10:30 assajos. 11:30–11:50 únic que fusiona arreglos crítics.

---

## Laura (B) — IA i dades

### 17:20–17:45 · Fase 0
- `git pull`, `bash scripts/setup-member.sh`, Orca, `/skills`, `/plugin`. Rebre la clau d'OpenRouter de Pau (xat privat) i posar-la a `api/.env` (`OPENROUTER_API_KEY`).

### 17:45–19:00 · Fase 1 — spike a `spikes/b-glossary/` (fora de web/ i api/)
Worktree `feat/spike-b-glossary`. Tres peces, cadascuna amb el seu pytest:
1. `generate_glossary.py`: llegeix `docs/demo/lesson-respiration.md`, crida OpenRouter amb un prompt que demana JSON amb el format **LessonTermInput** (API.md) + 5–8 frases clau. Valida l'esquema (Pydantic). **Mesura cost i temps** (imprimeix-los). Compara el resultat amb `docs/demo/glossary-respiration.json`.
2. `transparency.py`: `similarity(a, b)` i `is_transparent(llm_flag, lemma, translation_es)` amb la regla d'API.md. Tests amb els valors de referència (libérer 0.86, oxygène 0.71, déchet 0.62, chaleur 0.67).
3. `mastery.py` (mòdul PUR, sense BD): `initial_level(transparent)`, `state(level, previously_tapped)`, `apply_tap(level)`, `apply_practice(level, passed)`, `apply_preview(level)`, `autonomy(states)`, `weekly_autonomy(sessions)`. Tests de tots els límits (0 i 3).
- **Com provar**: `uv run --with pytest,httpx,pydantic pytest spikes/b-glossary`.
- **Fet quan**: a la SYNC 1 ensenyes un glossari generat vàlid + cost/temps, i passes a Miquel les signatures de `mastery.py`.

### 19:10–22:30 · Fase 2 — portar-ho a api/
1. Branca `feat/api-mastery`: `api/app/mastery.py` + `api/app/transparency.py` + tests. Petit i ràpid: **Miquel en depèn**. Afegir `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `ELEVENLABS_API_KEY` a `api/.env.example`.
2. Branca `feat/api-lessons`: `POST /api/lessons` (JSON o PDF/txt; si és PDF, extreure text — si cal una llibreria nova, anota-la a PLAN.md › Decisions) → LLM → validació → transparència → desar `lessons` + `lesson_terms`. Fitxers: `api/app/routers/lessons.py`, `api/app/llm.py` (client OpenRouter), `api/tests/test_lessons.py` (LLM **mockejat** als tests).
3. Lògica que aplica events i word-states als nivells (funcions de `mastery.py` + accés a `word_mastery`) per a Miquel: `api/app/mastery_store.py`.
- **Com provar**: pytest; i un cop real amb `prof-demo`: `POST /api/lessons` amb el text de demo → 15 termes semblants al JSON de demo.
- **Fet quan**: Miquel crida `mastery` des dels seus routers i el profe pot crear una lliçó real.

### 22:30–02:00 · Fase 3 — casa i progrés (F2, F4)
1. Branca `feat/api-home-review`: `GET /api/home/review` (clips pendents amb URL signada, `words_to_practice` amb `clip_id` o null). Fitxers: `api/app/routers/home.py`, test.
2. Branca `feat/api-practice`: `POST /api/practice` → +1 si `passed`, desa `practice_results`. Fitxers: `api/app/routers/practice.py`, test.
3. Branca `feat/api-progress`: `GET /api/me/progress` → frases positives en castellà (*"Esta semana has aprendido 12 palabras nuevas"*, *"Ya no necesitas ayuda con «mitochondrie»"*). Test que comprova que cap text conté `%` ni "de 15". Fitxers: `api/app/routers/progress.py`.
4. `mastery.autonomy` i `weekly_autonomy` exposades i documentades per a Miquel.
- **Fet quan**: Pau pot fer el flux casa complet contra l'API real.

### 02:00–05:00 · F3 (si SYNC 3 diu sí) o bugs
- Branca `feat/api-preview`: `GET /api/lessons/{id}/preview` i `POST …/preview/results`. Àudio generat **un cop per lliçó** amb ElevenLabs i desat a Storage; si falla o no hi ha clau → `audio_url: null` (el client fa `speechSynthesis`). Fitxers: `api/app/routers/preview.py`, `api/app/tts.py`, tests.
- Dorm 05:00–08:00.

### 08:00–12:00
- Prova del guió; 09:00–10:30 bugs, dades, pla B àudio; 10:30–11:30 **text de la submissió amb la Novelty** (de PLAN.md).

---

## Paula (C) — classe

### 17:20–17:45 · Fase 0
- `git pull`, setup, Orca, `/skills`, `/plugin`. Comprovar que tens **Chrome** (Web Speech només va bé a Chrome) i un micròfon.

### 17:45–19:00 · Fase 1 — spike a `spikes/c-subtitles/`
Worktree `feat/spike-c-subtitles`. Pàgina HTML/TS mínima (sense Next):
- Web Speech API `lang='fr-FR'`, `interimResults=true`, `continuous=true` (reiniciar quan s'aturi).
- Carrega `docs/demo/glossary-respiration.json` + un mapa de domini fals; marca les paraules amb els 3 estats (regla d'API.md).
- Llegeix el guió en veu alta (o que el llegeixi Pau) i **mesura**: latència aproximada, quantes de les 15 paraules detecta bé, si talla frases.
- **Fet quan**: a la SYNC 1 ensenyes la pàgina funcionant i dius si cal pla B (àudio pregravat).

### 19:10–22:30 · Fase 2 — /class (F1)
1. Branca `feat/web-wordstate`: `web/lib/contract.ts` (tipus TS d'API.md) + `web/lib/wordState.ts` + `web/lib/wordState.test.ts` (Vitest). Funcions pures: `matchTerms(text, terms)` (formes més llargues primer, multi-paraula, elisions `l'`/`d'`), `stateFor(lemma, mastery, previouslyTapped)`. Tests: `"les mitochondries"` → `mitochondrie`; `"du dioxyde de carbone"` → un sol match; nivell 1 + tocada abans → `orange`.
2. Branca `feat/web-class-subtitles`: `web/app/class/page.tsx` + components de la carpeta: carregar `GET /api/lessons` (la més recent) i el class-pack UNA vegada, `POST /api/sessions`, transcripció en directe (`web/lib/audio/speech.ts`), subtítols frase a frase amb els 3 estats (estils de `DESIGN.md` / components de Pau; 🟡 amb el castellà petit a sota), tocar paraula → `POST …/events` `{type:'word'}` i baixar el nivell localment. En acabar la classe → `POST …/word-states`.
- **Com provar**: Vitest; playwright-cli amb `lucia-w1` i `lucia-w4` → 2 screenshots amb estats diferents (es pot simular la transcripció amb un botó de dev que injecta el text del guió).
- **Fet quan**: a la SYNC 2, Pau llegeix el guió i a la pantalla de `lucia-w1` surten verds i grocs.

### 22:30–02:00 · Fase 3 — botons + clip (F2)
- Branca `feat/web-class-clip`: `web/lib/audio/ringBuffer.ts` (MediaRecorder, buffer circular de 30 s, + test de la lògica del buffer), botó gran **"No he entendido"** → puja àudio + transcripció dels últims 30 s a `POST /api/clips`; botó **"Me he perdido"** → event `lost`. Poliment de /class.
- **Fet quan**: després de prémer el botó, el clip surt a `GET /api/home/review`.

### 02:00–05:00 · F3 o bugs
- Branca `feat/web-tomorrow`: `/tomorrow` — reproduir les frases (àudio o `speechSynthesis`), tocar paraules reconegudes, missatge final sense percentatge. (Coordina carpeta amb Pau: és `web/app/tomorrow/`, nova, teva.)
- **Pla B àudio** (si s'ha decidit a la SYNC 1): mode demo que reprodueix `docs/demo/` àudio pregravat + transcripció amb temps.
- Dorm 05:00–08:00.

### 08:00–12:00
- Prova del guió; 09:00–10:30 `/unslop` + `web-design-guidelines` a /class; assajos.

---

## Pau (D) — casa + demo

### 17:20–17:45 · Fase 0
- **Estand d'AXA**: pitch d'una frase ("Subtítols en francès per a alumnes nouvinguts que es retiren a mesura que aprenen; 1 crida a l'LLM per lliçó, cap en directe") → demanar la **clau d'OpenRouter**. Passar-la a Miquel i Laura pel **xat privat**.
- **Estand d'IMC**: preguntar quina ONG d'educació/inclusió encaixa. Apuntar-ho a PLAN.md › Challenge.
- Setup + Orca quan tornis.

### 17:45–19:00 · Fase 1
- Revisar `docs/demo/lesson-respiration.md` i `glossary-respiration.json` (els 15 termes surten al text; llegir-lo en veu alta i cronometrar 40–50 s).
- Branca `feat/design-system`: reescriure `DESIGN.md` per a aquest producte: els **3 estats de paraula** accessibles (🟢 sense marca especial; 🟡 subratllat discontinu + traducció petita a sota; 🟠 subratllat doble + icona petita), contrast AA, tipografia gran per llegir a classe, estil general. Fer servir la skill `design-taste-frontend`.
- Esbossos (ASCII o paper fotografiat a `docs/demo/sketches/`) de: classe, casa, progrés, profe.
- **Fet quan**: `DESIGN.md` fusionat abans de la SYNC 1.

### 19:10–22:30 · Fase 2
1. **Primera hora** — branca `feat/ui-base`: `web/components/ui/` botó gran, targeta, `Word` (estils dels 3 estats) perquè Paula i Miquel els facin servir. **Fet quan**: PR fusionat ~20:15 i avisat al xat.
2. Branca `feat/web-home`: `/home` i `/progress` amb **dades falses** que segueixen exactament els JSON d'API.md (HomeReview i progress). Fitxers: `web/app/home/**`, `web/app/progress/**`.

### 22:30–02:00 · Fase 3
- Connectar `/home` a l'API real: llista de clips → reproduir → tocar la paraula → 3 activitats: (1) escoltar i identificar-la al clip, (2) frase del profe (`key_phrase`) amb un buit, (3) dir-la en veu alta (Web Speech `fr-FR`; si no la reconeix, "¡Hecho! (no te hemos oído bien)" i continuar). En acabar → `POST /api/practice`. `/progress` amb `GET /api/me/progress` (cap percentatge).
- QA del flux de la demo amb playwright-cli (screenshots a cada pas). Començar slides.

### 02:00–05:00 · dorm. 05:00–08:00
- Slides; dades de demo amb Miquel; guió de la demo en paper.

### 08:00–12:00
- 08:00 prova del guió. 09:00–10:30 `/unslop` + `web-design-guidelines` a /home, /progress, /teacher; **gravar un vídeo de la demo funcionant** (pla B). 10:30–11:30 slides finals + 3 assajos cronometrats (90 s).

---

## Riscos i pla B
| Risc | Pla B | Qui decideix i quan |
|---|---|---|
| Web Speech no transcriu bé/ràpid a la sala | Àudio pregravat del guió + transcripció amb temps, reproduïts sincronitzats | Paula, SYNC 1 |
| No tenim clau d'OpenRouter o l'LLM falla | La lliçó de demo es carrega des de `docs/demo/glossary-respiration.json` (seed); `POST /api/lessons` es mostra amb el resultat desat | Laura, SYNC 1 |
| Esquelet/migració endarrerits | Tothom treballa amb dades falses del contracte (API.md) fins que hi siguin | Miquel, SYNC 1 |
| F1 no funciona a les 22:30 | Tothom a F1; F2/F4 esperen | Miquel, SYNC 2 |
| Wi-Fi de la sala / Supabase lent a la demo | Vídeo gravat de la demo; demo en local en un portàtil | Pau, 09:00 |
| Límit de Claude Pro (barra 5h) | Màxim 2 agents; `/clear`; Sonnet; avisar al xat al 70% | cadascú |
| ElevenLabs falla (F3) | `speechSynthesis` del navegador | Laura |
