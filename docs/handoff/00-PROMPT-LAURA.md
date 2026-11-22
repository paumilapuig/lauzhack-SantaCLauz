/feature Connectar /home i /progress a l'API real + camí de conceptes a /home (ho fa Laura, B, a l'àrea del Pau, D)

## Context
El Pau (D, propietari de web/app/home, web/app/progress, web/components) NO pot fer aquesta feina. La faig jo, Laura (B),
perquè el backend és meu. Tocar l'àrea d'una altra persona és permès si és el mínim i s'anota a docs/STATUS.md › Requests:
"Laura (B) ha connectat /home i /progress a l'API real i ha afegit el camí de conceptes a /home (àrea del Pau, D), PR <n>".
No canviïs l'estil visual del Pau: reutilitza els seus components i DESIGN.md. Afegeix, no redissenyis.

## 0. Abans de res (ensenya'm el resultat de cada pas)
1. `git status` i `git branch --show-current`. Branca: `feat/web-home-api` (amb o sense prefix laurarebollocrespo/). Si sóc a
   main o hi ha canvis sense desar, ATURA'T. Si l'únic canvi és un `package-lock.json` buit a l'arrel (sense "node_modules/"), esborra'l.
2. Si falten `web/.env.local` o `api/.env`, copia'ls de C:\Users\laura\Desktop\lauzhack-SantaCLauz (MAI en mostris el contingut).
3. `git fetch origin` i `git pull --rebase origin main`. `cd web && npm install && npx vitest run`: tot verd. Si no, ATURA'T.
4. Llegeix SENCERS, en aquest ordre, els fitxers de `docs/handoff/` (l'especificació completa):
   `README.md`, `01-estat-actual.md`, `02-endpoints.md`, `06-trampes.md`, `04-cami-conceptes-ui.md`, `03-tasques.md`,
   `05-dades-demo-i-proves.md`, `student-contract.ts`. (On diu "Pau" o "el teu codi", vol dir el codi del Pau que ara toco jo.)
   Després llegeix `CLAUDE.md`, `DESIGN.md` (§ 6 Casa, § 7 Moviment, § 8 Accessibilitat, § 9 Textos), `docs/API.md` (HomeReview,
   Concept gaps, marks, practice, progress) i el codi actual de `web/app/home/`, `web/app/progress/`, `web/components/`,
   `web/lib/api.ts`, `web/lib/api-client.ts`, `web/lib/supabase/proxy-session.ts`.
5. `docs/handoff/` és documentació de treball: NO l'afegeixis a cap commit.

## 1. Què cal fer
Exactament les tasques T1–T8 de `docs/handoff/03-tasques.md`, amb el comportament de `04-cami-conceptes-ui.md`, els
contractes de `02-endpoints.md`, i evitant TOTES les trampes de `06-trampes.md`. Si alguna cosa del paquet contradiu
`docs/API.md` de main, mana `docs/API.md`: atura't i digues-m'ho.
- Fes servir `api.request<T>()` de `web/lib/api-client.ts` (no un fetch nou).
- Reutilitza: `Word`, `BigButton`, `Card`, `Dialog`, `StudentPage`, `ProgressHero`, `ProgressMessage`, `web/app/home/speech.ts`,
  `web/app/home/exercises/exercise-shell.tsx`, els 7 modes de pràctica tal com són.
- `POST /api/practice` i `GET /api/me/progress` poden no ser encara a main (els fa un altre PR meu en paral·lel). Programa contra
  el contracte; mentre donin 404, la UI no s'ha de trencar (trampa 7). Abans del pas 5, torna a fer `git pull --rebase origin main`
  i comprova si ja hi són.

## 2. Fitxers
Els de `03-tasques.md`. NO toquis: `api/`, `supabase/`, `docs/API.md`, `web/app/class/` (Paula), `web/app/teacher/` (Miquel),
`web/lib/api.ts`. Excepció fora d'aquestes àrees: la línia de `web/lib/supabase/proxy-session.ts` (T3), anotada a STATUS.
Màxim 300 línies per fitxer. Cap llibreria nova.

## 3. Pla
Fes l'spec a `docs/specs/web-home-api.md` amb les onades de `03-tasques.md` (onada 1: T1, T2, T3 en paral·lel; onada 2: T4, T5, T6
en paral·lel — T4 i T5 comparteixen `home-review.tsx`: que T5 només hi afegeixi la secció de conceptes al final, o fes T5 després de
T4; onada 3: T7, T8). Ensenya-me-la abans de programar.

## 4. Verificació (abans de dir que està fet)
- `npm run lint`, `npx vitest run`, `npm run build`: tot verd.
- `playwright-cli` amb `lucia-w4` i `lucia-w1` (la contrasenya me la demanes; no la desis enlloc) i les captures de
  `05-dades-demo-i-proves.md` › Verificació final. Ensenya-me les captures.
- NO responguis bé totes les preguntes del concepte de `lucia-w4` a la BD real (l'esborraria de la demo): el camí "understood"
  només amb tests; a la BD real, només el camí "review".
- grep: cap ús de `FAKE_REVIEW`, `getMyWords`, `saveMark`, `removeMark`.

## 5. Git (NO facis merge a main)
Commits petits `web: <què>`. `git pull --rebase origin main` abans del push; si hi ha conflicte a `docs/STATUS.md`, conserva
les línies de tothom i només canvia la meva (Laura (B)) + la nota a Requests. `/ship` amb títol
"web: /home and /progress on the real API + concept path". MAI force-push sense preguntar-me.
Ensenya'm l'URL del PR, els tests, les captures i 3 línies de resum.
