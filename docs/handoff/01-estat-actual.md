# 01 — Estat actual del frontend de casa (main @ 4256259)

## Què és fals avui
Tot surt de `web/app/home/data.ts` (147 línies). Cap funció crida l'API:

| Funció a `data.ts` | Què fa ara | Qui la fa servir | Endpoint real que l'ha de substituir |
|---|---|---|---|
| `getHomeReview()` | retorna `FAKE_REVIEW` (2 clips inventats) | `home-review.tsx:25` | `GET /api/home/review` |
| `getMyWords()` | retorna una llista en memòria (`marks`) | `home-review.tsx:22` | surt de `GET /api/home/review` › `words_to_practice` (no hi ha endpoint propi) |
| `saveMark(word, clipId)` | afegeix a la llista en memòria | `home-review.tsx:39` | `POST /api/clips/{clipId}/marks` |
| `removeMark(lemma)` | treu de la llista en memòria | `home-review.tsx:39` | `DELETE /api/clips/{clipId}/marks/{word}` (**necessita el clip_id**) |
| `savePractice(req)` | puja el nivell en un `Map` local | `home-review.tsx:33`, `practice-flow.tsx:64` | `POST /api/practice` |
| `getProgress()` | 3 frases fixes | `web/app/progress/page.tsx:7` | `GET /api/me/progress` |
| `translate(word)` | diccionari fix `DICTIONARY` | `clip-transcript.tsx:47`, `home-review.tsx` | **no hi ha endpoint**: vegeu `06-trampes.md` § Traduccions |
| `DISTRACTORS` | 5 lemes fixos | `practice-flow.tsx:6` | es pot quedar (no depèn de l'API) |

## Què ja és real i pots reutilitzar
- `web/lib/api.ts` → `createApiClient(baseUrl, getToken, fetchImpl)` amb `request<T>(path, init)`.
  Afegeix `Authorization: Bearer <token>` i posa `Content-Type: application/json` si hi ha `body`.
  Si la resposta no és 2xx llança `ApiError(status, message)`.
- `web/lib/api-client.ts` → `export const api = createApiClient(NEXT_PUBLIC_API_URL ?? "http://localhost:8000", getAccessToken)`.
  El token surt de la sessió de Supabase del navegador. **Fes servir `api.request<T>(...)`**, no un `fetch` nou.
- `web/lib/student-contract.ts` → tipus del contracte, però **desactualitzats** (vegeu `student-contract.ts` d'aquest paquet).
- Components: `Word` (`web/components/ui/word.tsx`), `BigButton`, `Card`, `Dialog`, `StudentPage`, `ProgressHero`,
  `ProgressMessage`, i els 7 modes de pràctica de `web/app/home/exercises/`.

## Login i protecció de pàgines
- `web/lib/supabase/proxy-session.ts:5` → `const PROTECTED_PREFIXES = ["/dashboard"];`
  Ara `/home`, `/progress` i `/class` s'obren **sense login**, i llavors l'API respon 401 (no hi ha token).
  Cal afegir-les: `["/dashboard", "/home", "/progress", "/class"]` (canvi d'1 línia; és un fitxer de l'esquelet del Miquel → anota-ho a STATUS).

## Pàgines
- `web/app/home/page.tsx` → `<HomeReview />` (client component, `home-review.tsx`).
- `web/app/progress/page.tsx` → **server component** (`async`) que crida `getProgress()`.
  ⚠️ Un server component no té la sessió del navegador → `api.request` no tindria token. Cal convertir-la en
  client component (o un fill client que faci la crida). Vegeu `03-tasques.md` T6.
