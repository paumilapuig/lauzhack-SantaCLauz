# 02 — Endpoints que ha de cridar el frontend de casa

Base URL: `NEXT_PUBLIC_API_URL` (dev: `http://localhost:8000`). Swagger: `http://localhost:8000/docs`.
Totes les rutes: `Authorization: Bearer <access_token de Supabase>`, rol **student**.
Errors comuns: `401` sense token o token invàlid · `403` l'usuari no és student · cos `{ "detail": str }`.
Font de veritat: `docs/API.md` a `main`. Aquí hi ha el mateix, amb el que fa el codi de veritat.

---

## 1. `GET /api/home/review` — ✅ a main (Laura, #33 + #37)
Una sola crida carrega tota la pantalla de casa.

```json
{
  "clips": [
    {
      "id": "c1b2…", "lesson_title": "La respiration cellulaire", "created_at": "2026-11-22T00:20:00+00:00",
      "t_start": 88.0, "t_end": 99.0,
      "transcript": "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.",
      "audio_url": "https://<ref>.supabase.co/storage/v1/object/sign/clips/…?token=…",
      "terms": ["déchet", "dioxyde de carbone"],
      "kind": "word", "lemma": null
    }
  ],
  "words_to_practice": [
    { "word": "déchets", "lemma": "déchet", "translation_es": "desecho",
      "definition_fr": "Ce qui reste et ne sert plus.",
      "key_phrase": "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.",
      "level": 0, "clip_id": "c1b2…" },
    { "word": "aussi", "lemma": null, "translation_es": null, "definition_fr": null,
      "key_phrase": "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.",
      "level": null, "clip_id": "c1b2…" }
  ],
  "concepts_to_learn": [
    { "id": "g7…", "lesson_title": "La respiration cellulaire",
      "concept": "Pourquoi on a chaud pendant l'effort",
      "lemmas": ["chaleur", "effort"],
      "explanation": [
        { "fr": "Pendant l'effort, les muscles travaillent plus.", "es": "Durante el esfuerzo, los músculos trabajan más.", "visual": "🏃 → 💪" },
        { "fr": "Ils utilisent plus d'énergie.", "es": "Usan más energía.", "visual": "💪 → 🔋" },
        { "fr": "Une partie de l'énergie devient de la chaleur.", "es": "Una parte de la energía se vuelve calor.", "visual": "🔋 → 🔥" }
      ],
      "exercises": [
        { "question": "Pendant l'effort, le corps dégage…", "options": ["du froid", "de la chaleur"] },
        { "question": "Qui travaille plus pendant l'effort ?", "options": ["les muscles", "les cheveux", "les dents"] }
      ],
      "status": "review" }
  ]
}
```
Regles (fetes al servidor, no les repeteixis al client):
- `clips`: només clips de la Lucía amb àudio, pendents (sense cap `practice_results` `passed=true` d'aquell clip), més nous primer.
  `audio_url` és una URL signada que **caduca en 1 hora** → si la pàgina porta >1 h oberta, torna a cridar l'endpoint.
  `terms` són **lemes** del glossari (no les formes que surten al text: `déchet`, no `déchets`).
- `words_to_practice`: una entrada per paraula marcada a casa, més noves primer. `word` = la forma tal com la va tocar.
  Paraula del glossari amb `level ≥ 2` → **no surt** (ja la domina). Paraula fora del glossari → `lemma`, `translation_es`,
  `definition_fr` i `level` són **`null`**.
- `concepts_to_learn`: conceptes amb `status` `pending` o `review`. **Mai** porten la resposta correcta.
  Un concepte `understood` ja no surt. És un camí **separat** de `words_to_practice`: no els barregis.

## 2. `POST /api/clips/{clip_id}/marks` — ✅ a main (Miquel, #39)
Marcar una paraula d'un clip ("no l'entenc").
- Petició: `{ "word": "Déchets" }` (el servidor fa `trim().toLowerCase()`; màx. 80 caràcters).
- Resposta 200:
  - paraula del glossari: `{ "word": "déchets", "lemma": "déchet", "translation_es": "desecho", "level": 0 }`
    (la **primera** marca d'aquell lema en aquella sessió fa **−1** de nivell; `level` és el nivell nou).
  - fora del glossari: `{ "word": "aussi", "lemma": null, "translation_es": null, "level": null }`
- Marcar dues vegades la mateixa paraula al mateix clip → no fa res (idempotent), torna el mateix.
- Errors: `404` el clip no és de la Lucía · `422` paraula buida o > 80 caràcters.

## 3. `DELETE /api/clips/{clip_id}/marks/{word}` — ✅ a main (Miquel, #39)
Desmarcar. `word` va **a la URL** → fes `encodeURIComponent(word)` (hi ha accents i apòstrofs: `déchets`, `l'oxygène`).
- Resposta 200: `{ "ok": true, "level": 1 }` (glossari: si era l'última marca del lema a la sessió, es desfà el −1)
  o `{ "ok": true, "level": null }` (fora del glossari).
- Desmarcar una paraula que no estava marcada → `200 { "ok": true, ... }` (no és error).
- Errors: `404` el clip no és seu.

## 4. `POST /api/practice` — ✅ a main (Laura, #43)
Quan la Lucía acaba un exercici sobre una paraula.
- Petició: `{ "lemma": "déchet", "clip_id": "c1b2…" | null, "passed": true }`
- Resposta 200: `{ "lemma": "déchet", "level": 1, "leveled_up": true }`
- Regles: `passed: true` → +1 (màx. 3); `passed: false` → es desa però el nivell no canvia. `leveled_up` = ha pujat.
- **Només per a paraules del glossari** (`lemma` no null). Una paraula fora del glossari → `422 "Unknown lemma"`.
  → Al client: **no enviïs** `POST /api/practice` per a paraules amb `lemma === null` (practica-les igual, però sense desar).
- Errors: `404` `clip_id` d'una altra alumna · `422` lema desconegut.
- Quan una paraula arriba a nivell 2, a la propera càrrega de `/api/home/review` **ja no surt** a `words_to_practice`.

## 5. `GET /api/me/progress` — ✅ a main (Laura, #43)
```json
{ "messages": [
  { "kind": "learned_this_week", "text": "Esta semana has aprendido 12 palabras nuevas" },
  { "kind": "no_help_needed", "text": "Ya no necesitas ayuda con «nourriture»" },
  { "kind": "keep_going", "text": "Sigue así: mañana repasamos «déchet»" }
] }
```
- Textos ja en castellà, **mai** amb percentatges ni "X de Y". Mostra `text` tal qual.
- `learned_this_week` i `no_help_needed` poden **no sortir**. `keep_going` surt sempre.
- Ordre: el de la llista. El teu `ProgressHero` ja agafa `learned_this_week`.

## 6. `POST /api/concepts/{id}/answers` — ✅ a main (Laura, #37)
Quan la Lucía respon les preguntes d'un concepte.
- Petició: `{ "answers": [1, 0] }` → un índex (0-based) d'opció **per cada exercici, en ordre**.
- Resposta 200: `{ "correct": [true, false], "status": "review" }`
  - totes bé → `"status": "understood"` (el concepte ja no tornarà a sortir a `concepts_to_learn`);
  - alguna malament → `"status": "review"` (es queda; pot tornar a mirar l'explicació i provar-ho de nou).
- Errors: `404` no existeix o no és seu · `409` ja estava `understood` · `422` nombre de respostes ≠ nombre
  d'exercicis, o índex fora de rang.
- El servidor no diu quina era la resposta bona (només `correct[]`). No l'intentis endevinar.

---

## Com cridar-los (patró recomanat)
```ts
import { api } from "@/lib/api-client"
import type { HomeReview, MarkResult, UnmarkResult, PracticeRequest, PracticeResponse,
  ProgressResponse, ConceptAnswersResponse } from "@/lib/student-contract"

export const getHomeReview = () => api.request<HomeReview>("/api/home/review")
export const markWord = (clipId: string, word: string) =>
  api.request<MarkResult>(`/api/clips/${clipId}/marks`, { method: "POST", body: JSON.stringify({ word }) })
export const unmarkWord = (clipId: string, word: string) =>
  api.request<UnmarkResult>(`/api/clips/${clipId}/marks/${encodeURIComponent(word)}`, { method: "DELETE" })
export const savePractice = (req: PracticeRequest) =>
  api.request<PracticeResponse>("/api/practice", { method: "POST", body: JSON.stringify(req) })
export const getProgress = () => api.request<ProgressResponse>("/api/me/progress")
export const answerConcept = (id: string, answers: number[]) =>
  api.request<ConceptAnswersResponse>(`/api/concepts/${id}/answers`, { method: "POST", body: JSON.stringify({ answers }) })
```
Per als tests: `createApiClient(base, async () => "token", fakeFetch)` de `web/lib/api.ts` accepta un `fetch` fals.
