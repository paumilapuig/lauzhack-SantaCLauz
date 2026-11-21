# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | feat/api-classdata | Fet: 5 endpoints de classe (`api/app/routers/classdata*`, `api/app/roles.py`), 100+ tests amb Supabase simulat (PR obert). Següent: `/teacher` dashboard + clips | – | Sat 21 Nov |
| Laura (B) | feat/api-lessons | Fet: `POST /api/lessons` (text/PDF/foto → 1 crida OpenRouter → `lessons` + `lesson_terms`), PR #18 + docs PR #19. **Primera prova real** (gemini-2.5-flash-lite, text de la demo): 15/15 termes, 8 verds/7 grocs = referència, 4,4 s, **0,00083 $**. Següent: prova amb foto + `prof-demo`; després `feat/api-home-review` / `feat/api-practice` | – | Sat 21 Nov 22:00 |
| Paula (C) | feat/spike-c-subtitles | Fet: spike `spikes/c-subtitles/` (PR obert; pàgina cablejada, 37 tests). Següent: prova de micro a Chrome amb `lesson-respiration.md` (retard + N/15), després passar `wordState.ts` a `web/lib/` i començar `/class` | – | Sat 21 Nov 18:45 |
| Pau (D) | feat/home-practice-modes | Marcar paraules només al clip de casa (no a classe), 7 modes de pràctica, dashboard compacte a 2 columnes. Pendent: protegir /home i /progress al proxy; connectar `data.ts` als endpoints de Laura. Següent: pitch + slides | – | Sat 21 Nov 21:30 |

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
