# STATUS — one line per person, update at the end of every task (/ship does it)

| Who | Branch | Doing now | Blocked by | Last update |
|---|---|---|---|---|
| Miquel (A) | – | Fet: migració del contracte aplicada al projecte compartit, tipus regenerats, 3 usuaris de demo creats. Següent: `feat/api-classdata` (endpoints de classe) i `feat/db-demo-seed` | mastery.py de Laura | Sat 21 Nov |
| Laura (B) | docs/project-definition | PR de docs obert. Següent: spike `spikes/b-glossary/` (glossari amb OpenRouter, transparència, `mastery.py` + pytest) | clau d'OpenRouter (Pau) | Sat 21 Nov 17:20 |
| Paula (C) | feat/class-buttons | Fet: spike de subtítols (fusionat) i `/class` amb botons «No he entendido» (clip 10–15 s) i «Me he perdido» (últims 60 s de transcripció), en mode mock (spec `docs/specs/c-class-buttons.md`). Següent: prova de micro + Web Speech a Chrome, portar `wordState.ts` a `web/lib/` i subtítols a `/class` | decisions D1–D4 de l'spec; Miquel/Laura per P1–P5 | Sat 21 Nov 23:00 |
| Pau (D) | feat/web-home | `/home` (clips + paraules + 3 activitats) i `/progress` (frases, mai %) amb dades falses d'API.md darrere `web/app/home/data.ts`. Pendent: protegir /home i /progress al proxy quan hi hagi dades reals; connectar `data.ts` als endpoints de Laura. Següent: pitch + slides | – | Sat 21 Nov 20:30 |

## Requests to other areas
- A touched web/lib/api.ts (Me type) for Paula
- Paula → Miquel: `class_events` needs nullable `context_transcript text` and `concept text`; `POST /api/sessions/{id}/events` with `type:"lost"` accepts optional `context {t_start, transcript}`; `NEXT_PUBLIC_CLASS_API=mock|http` in `web/.env.example`; `web/lib/api.ts` forces JSON Content-Type on every body (breaks multipart; I use my own upload in `web/app/class/classApi.ts`). Details: `docs/specs/c-class-buttons.md` P1–P5.
- Paula → Laura: `extract_concept(transcript, glossary)` as a server-side background task after a `lost` event, writing `class_events.concept` (never shown to the student). Needs a team decision first (PLAN says no LLM in class): D2 in the spec.
