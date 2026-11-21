# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | feat/db-demo-seed | Fet: migració del contracte aplicada al projecte compartit, tipus regenerats, 3 usuaris de demo creats; seed de demo només local (README §7) i test 03 (PR obert). Següent: `feat/api-classdata` (endpoints de classe) | mastery.py de Laura | Sat 21 Nov |
| Laura (B) | laurarebollocrespo/feat/spike-b-glossary | Spike `spikes/b-glossary/` fet (transparència, `mastery.py` pur, glossari multimodal text+imatge amb 1 crida OpenRouter, reducció d'imatge, caché, benchmark de models; 60 tests amb HTTP simulat). Següent: prova real + benchmark quan hi hagi clau, després `feat/api-mastery` | clau d'OpenRouter (Pau) | Sat 21 Nov 18:45 |
| Paula (C) | feat/spike-c-subtitles | Fet: spike `spikes/c-subtitles/` (PR obert; pàgina cablejada, 37 tests). Següent: prova de micro a Chrome amb `lesson-respiration.md` (retard + N/15), després passar `wordState.ts` a `web/lib/` i començar `/class` | – | Sat 21 Nov 18:45 |
| Pau (D) | feat/web-home | `/home` (clips + paraules + 3 activitats) i `/progress` (frases, mai %) amb dades falses d'API.md darrere `web/app/home/data.ts`. Pendent: protegir /home i /progress al proxy quan hi hagi dades reals; connectar `data.ts` als endpoints de Laura. Següent: pitch + slides | – | Sat 21 Nov 20:30 |

## Requests to other areas
- A touched web/lib/api.ts (Me type) for Paula
- (e.g. "Paula → Miquel: need column `x` in `class_events`")
- Laura → Miquel: signatures de `spikes/b-glossary/mastery.py` llestes per a classdata (initial_level, state, apply_tap, apply_practice, apply_preview, autonomy, weekly_autonomy).
- Laura → equip (SYNC 1): proposta AXA multimodal — `POST /api/lessons` accepta també fotos (pàgina del llibre/pissarra) → model de visió; cal decisió a PLAN + canvi a API.md (A).
- Laura ha afegit 1 línia a PLAN.md › Decisions log (Pillow per al spike).
