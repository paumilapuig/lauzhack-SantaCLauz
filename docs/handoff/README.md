# Paquet per al Pau: frontend de casa connectat a l'API real

De: Laura (B, IA i dades) · Per a: Pau (D, casa + demo) · Diumenge 22 nov, ~02:30
Estat de `main` quan es va fer aquest paquet: commit `4256259` (PRs fins al #41 fusionats).

## Què és això
El backend de casa ja és a `main` i funciona contra la BD compartida. Les teves pantalles `/home` i `/progress`
encara llegeixen **dades inventades** de `web/app/home/data.ts` (`FAKE_REVIEW`). Aquest paquet explica, amb tot detall,
què cal canviar perquè facin servir l'API de veritat, i què cal construir de nou: el **camí de conceptes**
("Me he perdido" → explicació visual + exercicis).

## Com fer-lo servir (5 minuts)
1. Descomprimeix el zip **fora del repo** (p. ex. a l'Escriptori). No el posis a git.
2. `git checkout main && git pull`.
3. A Orca: **New worktree** amb la branca `feat/web-home-api`.
4. Copia la carpeta descomprimida **dins del worktree** a `docs/handoff/` (així el teu Claude la pot llegir).
   Abans de fer el PR, esborra `docs/handoff/` o no l'afegeixis al commit.
5. Obre `claude` al worktree i enganxa el contingut de **`00-PROMPT.md`** sencer.

## Fitxers
| Fitxer | Què hi ha |
|---|---|
| `00-PROMPT.md` | El prompt per enganxar al teu Claude (`/feature ...`) |
| `01-estat-actual.md` | Què hi ha ara al frontend, què és fals i què ja és real |
| `02-endpoints.md` | Cada endpoint que has de cridar: petició, resposta, errors, exemples JSON reals |
| `03-tasques.md` | Les tasques (T1–T8), fitxers, tests i "fet quan" |
| `04-cami-conceptes-ui.md` | Disseny i comportament de la secció nova de conceptes |
| `05-dades-demo-i-proves.md` | Què veu cada usuari de la demo i com provar-ho |
| `06-trampes.md` | Coses que trencarien la pantalla si no les saps (llegeix-ho!) |
| `student-contract.ts` | Tipus TypeScript nous, llestos per substituir `web/lib/student-contract.ts` |

## Resum en 30 segons
- **Paraules (ja tens la UI):** substituir les funcions falses de `data.ts` per crides reals:
  `GET /api/home/review`, `POST` i `DELETE /api/clips/{id}/marks`, `POST /api/practice`.
- **Progrés (ja tens la UI):** `GET /api/me/progress`.
- **Conceptes (UI nova):** a `/home`, una secció separada amb `concepts_to_learn`: explicació pas a pas amb
  emojis animats + 2–3 preguntes; `POST /api/concepts/{id}/answers` diu si ho ha entès.
- **Login:** protegir `/home`, `/progress` i `/class` al proxy.
- ✅ Tots els endpoints que necessites ja són a `main` (també `POST /api/practice` i `GET /api/me/progress`, PR #43).
- **L'especificació aprovada és `docs/specs/web-home-api.md`** (té prioritat sobre `03-tasques.md` si difereixen).

Dubtes sobre l'API → Laura. Dubtes sobre `/marks` o `/teacher` → Miquel.
