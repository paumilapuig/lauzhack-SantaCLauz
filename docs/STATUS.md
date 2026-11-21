# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | feat/db-demo-seed | Fet: migració del contracte aplicada al projecte compartit, tipus regenerats, 3 usuaris de demo creats; seed de demo només local (README §7) i test 03 (PR obert). Següent: `feat/api-classdata` (endpoints de classe) | mastery.py de Laura | Sat 21 Nov |
| Laura (B) | feat/api-mastery | Fet: spike del glossari (PR #9 fusionada); `api/app/mastery.py` + `api/app/transparency.py` amb tests (PR obert). Següent: `feat/api-lessons` (`POST /api/lessons`, PDF/text/foto → LLM); prova real quan hi hagi clau | clau d'OpenRouter (Pau) | Sat 21 Nov 19:30 |
| Paula (C) | feat/spike-c-subtitles | Fet: spike `spikes/c-subtitles/` (PR obert; pàgina cablejada, 37 tests). Següent: prova de micro a Chrome amb `lesson-respiration.md` (retard + N/15), després passar `wordState.ts` a `web/lib/` i començar `/class` | – | Sat 21 Nov 18:45 |
| Pau (D) | feat/home-redesign | Redisseny de `/home` i `/progress` (direcció "quadern": clip amb ona d'àudio, fitxes de vocabulari, retolador, hero de progrés) + DESIGN.md §6 Casa. Pendent: protegir /home i /progress al proxy; connectar `data.ts` als endpoints de Laura. Següent: pitch + slides | – | Sat 21 Nov 21:30 |

## Requests to other areas
- A touched web/lib/api.ts (Me type) for Paula
- (e.g. "Paula → Miquel: need column `x` in `class_events`")
- Laura → Miquel: signatures de `spikes/b-glossary/mastery.py` llestes per a classdata (initial_level, state, apply_tap, apply_practice, apply_preview, autonomy, weekly_autonomy).
- Laura → equip (SYNC 1): proposta AXA multimodal — `POST /api/lessons` accepta també fotos (pàgina del llibre/pissarra) → model de visió; cal decisió a PLAN + canvi a API.md (A).
- Laura ha afegit 1 línia a PLAN.md › Decisions log (Pillow per al spike).
