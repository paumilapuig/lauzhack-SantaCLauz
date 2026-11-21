# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | feat/db-contract-tables | Fet: migració del contracte (PR obert, pendent `db push`), `/api/me` amb role. Següent: `db push` + tipus, 3 usuaris de demo, després `feat/api-classdata` | – | Sat 21 Nov |
| Laura (B) | laurarebollocrespo/feat/spike-b-glossary | Spike `spikes/b-glossary/` fet (transparència, `mastery.py` pur, glossari multimodal text+imatge amb 1 crida OpenRouter, reducció d'imatge, caché, benchmark de models; 60 tests amb HTTP simulat). Següent: prova real + benchmark quan hi hagi clau, després `feat/api-mastery` | clau d'OpenRouter (Pau) | Sat 21 Nov 18:45 |
| Paula (C) | – | Spike `spikes/c-subtitles/`: Web Speech fr-FR + estats de paraula sobre `docs/demo/glossary-respiration.json` | – | Sat 21 Nov 17:20 |
| Pau (D) | feat/design-system | `DESIGN.md` reescrit (3 estats de paraula, tokens AA, botons grans, pantalles). Següent: `feat/ui-base` (Word, botó gran, targeta) | – | Sat 21 Nov 18:30 |

## Requests to other areas
- A touched web/lib/api.ts (Me type) for Paula
- (e.g. "Paula → Miquel: need column `x` in `class_events`")
- Laura → Miquel: signatures de `spikes/b-glossary/mastery.py` llestes per a classdata (initial_level, state, apply_tap, apply_practice, apply_preview, autonomy, weekly_autonomy).
- Laura → equip (SYNC 1): proposta AXA multimodal — `POST /api/lessons` accepta també fotos (pàgina del llibre/pissarra) → model de visió; cal decisió a PLAN + canvi a API.md (A).
- Laura ha afegit 1 línia a PLAN.md › Decisions log (Pillow per al spike).
