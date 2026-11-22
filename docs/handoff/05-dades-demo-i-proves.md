# 05 — Dades de la demo i com provar-ho

## Engegar-ho en local
```bash
git checkout main && git pull
npm run dev:api     # http://localhost:8000/docs  (api/.env amb SUPABASE_* i OPENROUTER_API_KEY)
npm run dev:web     # http://localhost:3000
```
La BD és la compartida al núvol: el que facis (marcar, practicar, respondre conceptes) **es desa de veritat**.

## Usuaris (contrasenya: al xat privat; el Miquel l'ha de tornar a posar perquè ha canviat)
| Usuari | Què hi ha ara a la BD | Què hauria de veure a `/home` |
|---|---|---|
| `lucia-w1@demo.lauzhack` | 2 clips **amb àudio**, 4 paraules marcades, 0 conceptes | 2 clips que es poden escoltar; paraules a "Practicar"; cap secció de conceptes (fins que faci una classe amb "Me he perdido") |
| `lucia-w4@demo.lauzhack` | 1 clip **sense àudio**, 2 marques (`déchets`, `chaleur`), 2 conceptes (1 `understood`, 1 `review`), 12 pràctiques aquesta setmana | 0 clips (vegeu trampa 9); `déchets`/`chaleur` a "Practicar"; **1 concepte**: "Pourquoi on a chaud pendant l'effort" amb etiqueta "Repasar" |
| `prof-demo@demo.lauzhack` | profe | `/home` → l'API respon 403 (no és alumna) |

Concepte real de `lucia-w4` (per provar la UI de conceptes):
- Pas 1: `🏃 → 💪` · "Pendant l'effort, les muscles travaillent plus." · "Durante el esfuerzo, los músculos trabajan más."
- Pregunta 1: "Pendant l'effort, le corps dégage…" · opcions `du froid` / `de la chaleur`.

⚠️ Si respons bé totes les preguntes de `lucia-w4`, el concepte passa a `understood` i **desapareix per sempre** (és la BD real).
Per tornar-lo a tenir per a la demo, demana al Miquel que torni a aplicar `supabase/seed_demo_extra.sql` (és idempotent) o
digues-m'ho a mi. Per provar molts cops, fes-ho amb tests (fetch fals), no amb la BD.

## Provar l'API sense UI
`http://localhost:8000/docs` → botó "Authorize" → enganxa l'`access_token` de la Lucía.
Per treure el token (la web guarda la sessió en **cookies** amb `@supabase/ssr`, no a `localStorage`), demana'l
directament a Supabase Auth amb la contrasenya de la demo. Els valors de `URL` i `ANON` són els de `web/.env.local`
(`NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`); no els enganxis enlloc més:
```bash
curl -s "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"lucia-w4@demo.lauzhack","password":"<la del xat>"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])"
```
El token dura 1 hora.

## Verificació final (abans del PR)
1. `cd web && npm run lint && npx vitest run && npm run build`
2. `playwright-cli` (skill del repo) amb `lucia-w4`: captura de `/home` (paraules + concepte), del diàleg d'explicació
   (pas 1 i últim pas), del resultat `review`, i de `/progress`.
3. Amb `lucia-w1`: captura d'un clip reproduint-se i d'una paraula marcada.
4. Sense login: `/home` ha de redirigir a `/login`.
