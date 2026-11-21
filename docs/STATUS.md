# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | feat/api-classdata | Fet: 5 endpoints de classe (`api/app/routers/classdata*`, `api/app/roles.py`), 100+ tests amb Supabase simulat (PR obert). Següent: `/teacher` dashboard + clips | – | Sat 21 Nov |
| Laura (B) | feat/api-mastery | Fet: spike del glossari (PR #9 fusionada); `api/app/mastery.py` + `api/app/transparency.py` amb tests (PR obert). Següent: `feat/api-lessons` (`POST /api/lessons`, PDF/text/foto → LLM); prova real quan hi hagi clau | clau d'OpenRouter (Pau) | Sat 21 Nov 19:30 |
| Paula (C) | feat/spike-c-subtitles | Fet: spike `spikes/c-subtitles/` (PR obert; pàgina cablejada, 37 tests). Següent: prova de micro a Chrome amb `lesson-respiration.md` (retard + N/15), després passar `wordState.ts` a `web/lib/` i començar `/class` | – | Sat 21 Nov 18:45 |
| Pau (D) | feat/web-home | `/home` (clips + paraules + 3 activitats) i `/progress` (frases, mai %) amb dades falses d'API.md darrere `web/app/home/data.ts`. Pendent: protegir /home i /progress al proxy quan hi hagi dades reals; connectar `data.ts` als endpoints de Laura. Següent: pitch + slides | – | Sat 21 Nov 20:30 |

## Requests to other areas
- A touched web/lib/api.ts (Me type) for Paula
- (e.g. "Paula → Miquel: need column `x` in `class_events`")
- Laura → Miquel: signatures de `spikes/b-glossary/mastery.py` llestes per a classdata (initial_level, state, apply_tap, apply_practice, apply_preview, autonomy, weekly_autonomy).
- Laura → equip (SYNC 1): proposta AXA multimodal — `POST /api/lessons` accepta també fotos (pàgina del llibre/pissarra) → model de visió; cal decisió a PLAN + canvi a API.md (A).
- Laura ha afegit 1 línia a PLAN.md › Decisions log (Pillow per al spike).
- Miquel → Laura: nous fitxers a `api/tests/` (`fake_supabase.py`, `classdata_seed.py`, `test_classdata_*`); reutilitza `app.roles` (`StudentUser`/`TeacherUser`) i `classdata_schemas.LessonTerm`.
