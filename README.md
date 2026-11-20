# Kit LauzHack 2026 — setup de l'equip (4 × Claude Pro)

LauzHack: dissabte 21 nov, hacking de 12:00 a diumenge 12:00 (EPFL). Les normes permeten fer servir codi i recursos
existents, però el que presenteu ha de ser nou respecte d'ells i ho heu de dir explícitament als jutges (regla 30).
→ Aquest kit és **genèric** (auth + db + configs), i ho declarareu a `docs/PLAN.md › Novelty`.

## 0. Respostes ràpides
- **Projecte a claude.ai?** No cal. Amb Pro, un Project de claude.ai és personal (no el podeu compartir entre 4 comptes)
  i Claude Code no el llegeix. **Tot l'alineament viu al repo**: `CLAUDE.md` + `.claude/` + `.mcp.json` + `docs/`.
  Feu servir claude.ai només per al pitch/slides.
- **Com s'alineen els agents?** Cada persona té el seu Claude Code, però tots llegeixen els mateixos fitxers del repo:
  regles (`CLAUDE.md`), skills (`.claude/skills/`), plugins (`.claude/settings.json`), MCP (`.mcp.json`),
  contracte (`docs/API.md`) i estat (`docs/STATUS.md`). Si una cosa no és al repo, els agents no la saben.
- **Què NO instal·lar** (de la llista que us han passat): *Everything Claude Code* (48 agents/180+ skills, se solapa amb
  Superpowers, menja context i límits de Pro), *firstmate* (orquestrador sencer, massa per a 24 h), i no poseu
  *agent-browser* i *playwright-cli* alhora (fan el mateix → triat playwright-cli). Orca **o** Superset, no tots dos.

## 1. Stack
| Capa | Tecnologia | Per què |
|---|---|---|
| Frontend | Next.js + Tailwind + shadcn/ui | el que millor fa Claude, deploy a Vercel en 1 clic |
| Backend | FastAPI (Python, `uv`) | sou de data science: ML/pandas aquí. Opcional si no cal Python |
| BD + Auth | Supabase (1 projecte compartit al núvol) | Postgres + login fet, sense servidor |
| Agents | Claude Code + Superpowers + Caveman + skills al repo | tots iguals per `git pull` |
| MCP | Supabase (esquema/SQL), Context7 (docs actualitzades) | |

## 2. AVUI — el lead (persona A), ~45 min
1. **GitHub**: `gh repo create lauzhack-<equip> --private --clone && cd lauzhack-<equip>`
   Settings → Collaborators → convida els 3. Settings → Branches → protegeix `main` (exigir PR).
2. Copia tot el contingut d'aquest kit a l'arrel del repo (inclosos `.claude/`, `.mcp.json`, `.gitignore`).
3. **Supabase**: supabase.com → New project (regió Europe/Zurich o Frankfurt). Organization → Members → convida els 3.
   Apunta el *Project ref* (Settings → General) i les claus (Settings → API Keys).
   Authentication → Providers → Email: **desactiva "Confirm email"** (per anar ràpid a la demo).
4. `SUPABASE_REF=<ref> DESIGN_REF=linear bash scripts/bootstrap-lead.sh` → instal·la les skills dins del repo i baixa un `DESIGN.md`.
5. `bash scripts/setup-member.sh` i omple `web/.env.local` i `api/.env`.
6. `claude` → accepta trust + plugins → `/model` Opus → enganxa el primer prompt de **`PROMPT-scaffold.md`**.
   Quan acabi: `npx supabase link --project-ref <ref>` → `npx supabase db push`. Comprova login → dashboard.
7. Merge del PR a `main`. Envia les claus pel xat privat de l'equip (un sol missatge; mai al repo).

## 3. AVUI — cada membre (B, C, D), ~15 min
1. `gh auth login` → accepta la invitació → `gh repo clone <user>/lauzhack-<equip> && cd lauzhack-<equip>`
2. `bash scripts/setup-member.sh` → omple `web/.env.local` i `api/.env` amb les claus del xat.
3. `claude` a l'arrel del repo:
   - accepta "trust this folder" → t'oferirà instal·lar **Superpowers** i **Caveman** → accepta
   - `/mcp` → supabase → Authenticate (amb el compte convidat a l'organització)
   - `/skills` → han de sortir: grill-me, grilling, design-taste-frontend, image-to-code, web-design-guidelines, unslop, playwright-cli, seo-audit
4. Prova: `npm run dev` a `web/` + `uv run fastapi dev app/main.py` a `api/` → login funciona.
5. (Opcional) instal·la **Orca** (Mac/Win/Linux) o **Superset** (Mac) si vols 2–3 agents en paral·lel en worktrees.
   Amb Pro, més de 2 agents a la vegada per persona us cremarà el límit abans de mitjanit.

## 4. Què fa cada eina i quan usar-la
| Eina | Tipus | Quan | Com |
|---|---|---|---|
| Superpowers | plugin | features no trivials: brainstorm → pla → implementar → review | automàtic / "brainstorm this" |
| grill-me (+grilling) | skill | 12:00 per alinear la idea; abans de qualsevol feature gran | `/grill-me` |
| Caveman | plugin | sempre (respostes curtes = menys límit gastat) | `/caveman` per activar/desactivar |
| design-taste-frontend | skill | quan es construeix UI nova | automàtic en tasques de UI |
| DESIGN.md (awesome-design-md) | fitxer | estil visual coherent per als 4 agents | ja a l'arrel |
| image-to-code | skill | D fa un mockup/captura → codi | "use image-to-code on mock.png" |
| unslop | skill | diumenge 09:00, polir la UI que sembla feta per IA | `/unslop` |
| web-design-guidelines | skill | auditoria accessibilitat/UX abans de la demo | "review web/app with web-design-guidelines" |
| playwright-cli | skill+CLI | l'agent obre el navegador, fa clic i screenshot per verificar | automàtic en verificar UI |
| seo-audit | skill | només si feu landing pública (prioritat baixa) | "seo audit" |
| Supabase MCP | MCP | mirar esquema, fer queries, debug d'auth | automàtic |
| Context7 | MCP | docs actualitzades de Next/Supabase/FastAPI | "use context7" |
| `/sync`, `/ship` | comandes del repo | inici i final de cada tasca | |

## 5. DEMÀ — com treballar junts
- **12:00–12:45** tots davant d'una pantalla: prompt de `/grill-me` (a `PROMPT-scaffold.md`) → `docs/PLAN.md` + `docs/API.md` → merge.
- **Rols**: A = lead/BD/integració i merges · B = `api/` + ML · C = `web/app` lògica · D = UI, `DESIGN.md`, QA, pitch.
- **Cicle de cada tasca (~1 h)**: `/sync <àrea>` → tasca → `/ship` → PR petit → A el revisa i fa merge.
- **Contracte primer**: si cal un endpoint/columna nova, s'escriu a `docs/API.md` en un PR propi abans de codificar.
  Mentrestant, el front fa servir dades mock amb la mateixa forma.
- **Migracions**: només A. La resta les demana a `docs/STATUS.md › Requests`.
- **Límits Pro**: Sonnet per defecte, Opus només per plans/bugs difícils, `/clear` entre tasques, Caveman activat.
  Si a algú se li acaba el límit, passa a QA manual/slides mentre els altres programen.
- **Diumenge 09:00 freeze** → només bugs + `/unslop` + assaig de la demo. **12:00** entrega.

## 6. Estructura del kit
```
CLAUDE.md                 regles comunes per a tots els agents
.claude/settings.json     plugins compartits + permisos (bloqueja llegir .env i push a main)
.claude/commands/         /sync i /ship
.claude/skills/           (els omple bootstrap-lead.sh)
.mcp.json                 Supabase + Context7
docs/PLAN.md API.md STATUS.md
web/.env.example api/.env.example
scripts/bootstrap-lead.sh scripts/setup-member.sh
PROMPT-scaffold.md        prompts llestos per enganxar
```
Ajust personal sense afectar l'equip (p. ex. desactivar Caveman): `.claude/settings.local.json` (ignorat per git).
