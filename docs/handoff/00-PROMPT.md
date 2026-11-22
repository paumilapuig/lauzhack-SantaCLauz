/feature Connectar /home i /progress a l'API real + camí de conceptes a /home (owner D, Pau)

## 0. Abans de res (ensenya'm el resultat de cada pas)
1. `git status` i `git branch --show-current`. Branca: `feat/web-home-api` (amb o sense prefix). Si sóc a main o hi ha
   canvis sense desar, ATURA'T. Si l'únic canvi és un `package-lock.json` buit a l'arrel (sense "node_modules/"), esborra'l.
2. Si falten `web/.env.local` o `api/.env`, copia'ls de la carpeta original del repo (MAI en mostris el contingut).
3. `git fetch origin` i `git pull --rebase origin main`. `cd web && npm install && npx vitest run`: tot verd. Si no, ATURA'T.
4. Llegeix SENCERS, en aquest ordre, els fitxers de `docs/handoff/` (és el paquet de la Laura amb tota l'especificació):
   `README.md`, `01-estat-actual.md`, `02-endpoints.md`, `06-trampes.md`, `04-cami-conceptes-ui.md`, `03-tasques.md`,
   `05-dades-demo-i-proves.md`, `student-contract.ts`.
   Després llegeix `CLAUDE.md`, `DESIGN.md` (§ 6 Casa i § 9 Textos), `docs/API.md` (HomeReview, Concept gaps, marks,
   practice, progress) i el codi actual de `web/app/home/`, `web/app/progress/`, `web/lib/api.ts`, `web/lib/api-client.ts`.
5. `docs/handoff/` és documentació per a tu: NO l'afegeixis a cap commit.

## 1. Què cal fer
Exactament les tasques T1–T8 de `docs/handoff/03-tasques.md`, amb el comportament de `04-cami-conceptes-ui.md`, els
contractes de `02-endpoints.md` i evitant totes les trampes de `06-trampes.md`. Si alguna cosa del paquet contradiu
`docs/API.md` de main, mana `docs/API.md`: atura't i digues-m'ho.
Fes servir `api.request<T>()` de `web/lib/api-client.ts` (no un fetch nou). Reutilitza els meus components
(`Word`, `BigButton`, `Card`, `Dialog`, `StudentPage`, `ProgressHero`, `ProgressMessage`, `speech.ts`, `exercise-shell`).

## 2. Fitxers
Els de `03-tasques.md`. NO toquis: `api/`, `supabase/`, `docs/API.md`, `web/app/class/` (Paula), `web/app/teacher/` (Miquel),
`web/lib/api.ts`. L'única excepció fora de la meva àrea és la línia de `web/lib/supabase/proxy-session.ts` (T3), anotada a STATUS.
Màxim 300 línies per fitxer. Cap llibreria nova.

## 3. Pla
Fes l'spec a `docs/specs/web-home-api.md` amb les onades de `03-tasques.md` (onada 1: T1, T2, T3 en paral·lel; onada 2: T4, T5, T6;
onada 3: T7, T8), i ensenya-me-la abans de programar.

## 4. Verificació (abans de dir que està fet)
- `npm run lint`, `npx vitest run`, `npm run build`: tot verd.
- `playwright-cli` amb `lucia-w4` i `lucia-w1` (contrasenya: me la demanes) i les captures de `05-dades-demo-i-proves.md`.
- NO responguis bé totes les preguntes del concepte de `lucia-w4` a la BD real (l'esborraria de la demo): prova el
  camí "understood" amb tests, i a la BD real només el camí "review".
- grep: cap ús de `FAKE_REVIEW`, `getMyWords`, `saveMark`, `removeMark`.

## 5. Git (NO facis merge a main)
Commits petits `web: <què>`. `git pull --rebase origin main` abans del push; si hi ha conflicte a `docs/STATUS.md`,
conserva les línies de tothom i només canvia la meva. Actualitza NOMÉS la meva línia (Pau (D)) de STATUS.
`/ship` amb títol "web: /home and /progress on the real API + concept path". MAI force-push sense preguntar-me.
Ensenya'm l'URL del PR, els tests, i 3 línies de resum.
