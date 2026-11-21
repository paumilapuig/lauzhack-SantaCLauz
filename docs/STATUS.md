# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | feat/api-classdata | Fet: 5 endpoints de classe (`api/app/routers/classdata*`, `api/app/roles.py`), 100+ tests amb Supabase simulat (PR obert). Següent: `/teacher` dashboard + clips | – | Sat 21 Nov |
| Laura (B) | feat/api-lessons | Fet: `app/mastery.py` + `app/transparency.py` a main (#13); `POST /api/lessons` (text/PDF/foto → 1 crida OpenRouter → validació robusta → `lessons` + `lesson_terms`), PR oberta. Spike PDF a PR #14. Següent: prova real amb `prof-demo` quan hi hagi clau; després `feat/api-home-review` / `feat/api-practice` | clau d'OpenRouter (Pau) | Sat 21 Nov 21:00 |
| Paula (C) | feat/spike-c-subtitles | Fet: spike `spikes/c-subtitles/` (PR obert; pàgina cablejada, 37 tests). Següent: prova de micro a Chrome amb `lesson-respiration.md` (retard + N/15), després passar `wordState.ts` a `web/lib/` i començar `/class` | – | Sat 21 Nov 18:45 |
| Pau (D) | feat/home-redesign | Redisseny de `/home` i `/progress` (direcció "quadern": clip amb ona d'àudio, fitxes de vocabulari, retolador, hero de progrés) + DESIGN.md §6 Casa. Pendent: protegir /home i /progress al proxy; connectar `data.ts` als endpoints de Laura. Següent: pitch + slides | – | Sat 21 Nov 21:30 |

## Requests to other areas
- A touched web/lib/api.ts (Me type) for Paula
- (e.g. "Paula → Miquel: need column `x` in `class_events`")
- Miquel → Laura: nous fitxers a `api/tests/` (`fake_supabase.py`, `classdata_seed.py`, `test_classdata_*`); reutilitza `app.roles` (`StudentUser`/`TeacherUser`) i `classdata_schemas.LessonTerm`.
- Laura ha afegit 1 línia a PLAN.md › Decisions log (PyMuPDF per a l'entrada PDF del spike).
- Laura → Miquel: `mastery` ja és a main (`from app import mastery`): initial_level, state, apply_tap, apply_practice, apply_preview, autonomy, weekly_autonomy.
- Laura → Miquel: apuntar a PLAN.md › Decisions que `api/` fa servir **Pillow** i **PyMuPDF** (PDF/fotos per a `POST /api/lessons`; PyMuPDF és AGPL, OK per al hackathon).
- Laura → Miquel: PR de docs proposant que `POST /api/lessons` accepti també png/jpg (màx. 10 MB) i documentant errors 413/415/422/502/503 a API.md.
- Laura → equip: les 5–8 frases clau que retorna l'LLM NO es desen (no hi ha taula); si fem F3, cal una taula/columna (Miquel).
- Laura → Miquel: el formulari de /teacher ha d'enviar multipart (`title, subject, lesson_date, file`) per a PDF/foto, o JSON amb `source_text`.
