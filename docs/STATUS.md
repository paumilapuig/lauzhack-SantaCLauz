# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | docs/api-clip-kinds (PR #21 `feat/api-clips` oberta) | Fet: endpoints de classe (PR #16 fusionat) i `POST /api/clips` (PR #21, a revisió). Ara: PR de docs dels dos tipus de clip (`word`/`concept`). Següent: migració additiva `clips.kind`/`clips.lemma` + `clip_marks` + `/marks` + implementació. Detall a «Detall A» | revisió i merge del PR #21 · confirmació de Laura/Paula/Pau (vegeu Requests) | Sat 21 Nov |
| Laura (B) | feat/api-lessons | Fet: `POST /api/lessons` (text/PDF/foto → 1 crida OpenRouter → `lessons` + `lesson_terms`), PR #18 + docs PR #19. **Primera prova real** (gemini-2.5-flash-lite, text de la demo): 15/15 termes, 8 verds/7 grocs = referència, 4,4 s, **0,00083 $**. Següent: prova amb foto + `prof-demo`; després `feat/api-home-review` / `feat/api-practice` | – | Sat 21 Nov 22:00 |
| Paula (C) | feat/spike-c-subtitles | Fet: spike `spikes/c-subtitles/` (PR obert; pàgina cablejada, 37 tests). Següent: prova de micro a Chrome amb `lesson-respiration.md` (retard + N/15), després passar `wordState.ts` a `web/lib/` i començar `/class` | – | Sat 21 Nov 18:45 |
| Pau (D) | feat/home-practice-modes | Marcar paraules només al clip de casa (no a classe), 7 modes de pràctica, dashboard compacte a 2 columnes. Pendent: protegir /home i /progress al proxy; connectar `data.ts` als endpoints de Laura. Següent: pitch + slides | – | Sat 21 Nov 21:30 |

## Detall A (Miquel)
**Responsable de** (`CLAUDE.md` › Ownership; la taula actualitzada és al PR #21; Laura ha confirmat explícitament `clips*.py` i `test_clips*.py`):
`api/app/routers/classdata*`, `api/app/routers/clips*.py`, `api/app/storage.py`, `api/app/roles.py`, `api/tests/test_classdata*`, `api/tests/test_clips*`, `api/tests/test_storage.py`, `api/tests/fake_storage.py`, `api/tests/fake_supabase.py`, `api/tests/classdata_seed.py`.
**Fet**
- PR #16 (fusionat): `GET /api/lessons`, `GET /api/lessons/{id}/class-pack`, `POST /api/sessions`, `POST /api/sessions/{id}/events`, `POST /api/sessions/{id}/word-states` amb `api/app/roles.py`, comprovació de propietat de la sessió i tests amb Supabase simulat.
- PR #21 (oberta, rebasat sobre main amb `POST /api/lessons` de Laura; 243 tests passen, verificat sobre el cap del PR): `POST /api/clips` (`audio/webm`, màx. 2 MiB, pujada al bucket privat `clips`, fila a `clips`, event `unclear`, rollback sense orfes) i `signed_clip_url(db, path, expires=3600)` compartit a `app/storage.py`. La resposta continua sent `{ clip_id, audio_path }`.
**Pendent**
1. Revisió i merge del PR #21 (el merge el decideix Miquel).
2. Aquest PR de docs (dos tipus de clip).
3. Migració additiva `clips.kind` + `clips.lemma`, regeneració de tipus, implementació i tests (PR a part, després del #21).
4. Del PR #22 (Pau): migració `clip_marks`, `POST /api/clips/{id}/marks`, `DELETE /api/clips/{id}/marks/{word}`, seed de `lucia-w4`, i decisió de nivells.
5. Coordinació: Laura (`/api/home/review`), Paula (MediaRecorder), Pau (targetes de `/home`).
6. Cap migració ni upload al Supabase remot sense autorització.

## Requests to other areas
- A touched web/lib/api.ts (Me type) for Paula
- Pau → equip (decisió de producte): les paraules NO es marquen a classe; només es marquen al clip a casa. Afecta F2/PLAN (tocar paraula a classe = −1), l'estat 🟠 (ara: paraula marcada a casa que torna a sortir a classe) i el guió de la demo. Cal decidir-ho a la sync (A actualitza PLAN).
- (e.g. "Paula → Miquel: need column `x` in `class_events`")
- Pau → Miquel: API.md actualitzat (paraules marcades a casa, no a classe). Cal: migració `clip_marks`, `POST /api/clips/{id}/marks` i `DELETE /api/clips/{id}/marks/{word}`; `previously_tapped` i `top_words` ara surten de `clip_marks`; seed de `lucia-w4` amb marques a `déchets`/`chaleur`. **Nivells: encara no decidit** (marcar a casa fa −1? treiem `word` de `/events`?); de moment API.md › Rules no canvia.
- Pau → Laura: `GET /api/home/review` › `words_to_practice` ara surt de `clip_marks` (camp nou `word`; `lemma`/`translation_es`/`definition_fr`/`level` són null per a paraules fora del glossari).
- Miquel → Laura: nous fitxers a `api/tests/` (`fake_supabase.py`, `classdata_seed.py`, `test_classdata_*`); reutilitza `app.roles` (`StudentUser`/`TeacherUser`) i `classdata_schemas.LessonTerm`.
- Laura ha afegit 1 línia a PLAN.md › Decisions log (PyMuPDF per a l'entrada PDF del spike).
- Laura → Miquel: `mastery` ja és a main (`from app import mastery`): initial_level, state, apply_tap, apply_practice, apply_preview, autonomy, weekly_autonomy.
- Laura → Miquel: apuntar a PLAN.md › Decisions que `api/` fa servir **Pillow** i **PyMuPDF** (PDF/fotos per a `POST /api/lessons`; PyMuPDF és AGPL, OK per al hackathon).
- Laura → Miquel: PR de docs proposant que `POST /api/lessons` accepti també png/jpg (màx. 10 MB) i documentant errors 413/415/422/502/503 a API.md.
- Laura → equip: les 5–8 frases clau que retorna l'LLM NO es desen (no hi ha taula); si fem F3, cal una taula/columna (Miquel).
- Laura → Miquel: el formulari de /teacher ha d'enviar multipart (`title, subject, lesson_date, file`) per a PDF/foto, o JSON amb `source_text`.
- Miquel → equip: **dos tipus de clip** (PR de docs). `word` = dubte lèxic (tolerància 1–12 s, no genera event); `concept` = dubte conceptual (10–70 s, genera `unclear`). `kind` per defecte `concept`, `lemma` opcional validat contra la lliçó. Durades = toleràncies tècniques. **Pregunta oberta:** des del PR #22 l'alumna ja no marca cap paraula a classe, així que un `lemma` al clip `word` potser no es farà servir; decidim si el traiem abans de la migració. I un clip `word` ja no deixa cap event: el profe només veu aquests dubtes via `clip_marks`.
- Miquel → Laura: `GET /api/home/review` ha d'afegir `kind` i `lemma` a cada clip. Proposta (cal la teva confirmació): els clips `concept` sempre es llisten (no tenen lema, les 3 activitats no els apliquen); els `word` segueixen pendents fins a `practice_results.passed`. Per a `audio_url` reutilitza `from app.storage import signed_clip_url` (`signed_clip_url(db, path, expires=3600) -> str`, `db = get_supabase()`, `path = clips.audio_path`). `POST /api/clips` no retorna cap URL.
- Miquel → Paula: `/class` envia `kind` (`word` o `concept`) a `POST /api/clips`. El buffer ha de cobrir fins a 70 s (ara PLAN diu 30 s). Cada clip ha de ser un webm vàlid (cal provar la reproducció abans de pujar-lo: els trossos de `MediaRecorder` només porten la capçalera al primer), `audioBitsPerSecond` ≈ 32000 i `t_start`/`t_end` amb el mateix rellotge que els `t_sec` dels events. No cal enviar `unclear` ni cap `word`: ho fa l'API.
- Miquel → Pau: `/home` mostra dos tipus de targeta segons `clips[].kind` (`word`/`concept`); marcar paraules (`/marks`) funciona sobre qualsevol clip.
- Miquel → equip: PLAN › F2 encara diu «tocar una paraula = −1» i buffer de 30 s; falta actualitzar-lo a la sync (nivells encara pendents, vegeu Pau → Miquel).
