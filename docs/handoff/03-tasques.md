# 03 — Tasques (en onades; les de la mateixa onada no comparteixen fitxers)

Regles del repo: test primer · màx. 300 línies per fitxer · cap llibreria nova · `web/` Next.js + Tailwind + shadcn ·
segueix `DESIGN.md` · UI de l'alumna en **castellà** · cap percentatge a l'alumna.

## Onada 1 (en paral·lel)

### T1 — Tipus del contracte
- Fitxers: `web/lib/student-contract.ts` (substituir pel `student-contract.ts` d'aquest paquet).
- Ajustar tot el que no compili per culpa dels tipus nous (sobretot `WordToPractice` amb `word` i camps `null`):
  fes-ho a T2/T4, no aquí; aquí només el fitxer de tipus + `npx tsc --noEmit` per veure què es trenca.
- Fet quan: el fitxer coincideix camp per camp amb `02-endpoints.md`.

### T2 — Capa d'API de casa (substitueix `data.ts`)
- Fitxers: `web/app/home/data.ts` (reescriure), `web/app/home/data.test.ts` (reescriure), nou `web/app/home/to-practice-word.ts` (+ test).
- `data.ts` exporta exactament: `getHomeReview`, `markWord(clipId, word)`, `unmarkWord(clipId, word)`,
  `savePractice(req)`, `getProgress()`, `answerConcept(id, answers)` (patró de `02-endpoints.md` › "Com cridar-los"),
  i `DISTRACTORS` (es queda igual).
- Treu `FAKE_REVIEW`, `marks`, `levels`, `getMyWords`, `saveMark`, `removeMark`, `SEED_FORMS`.
- `translate`/`DICTIONARY`: vegeu `06-trampes.md` § 5 (o desapareix, o es mou a `demo-dictionary.ts` com a pla B explícit).
- `to-practice-word.ts`: `WordToPractice` (API) → tipus intern dels exercicis, amb `?? ""` als textos (trampa 1).
- Tests (fetch fals via `createApiClient(base, async () => "t", fakeFetch)` o mock de `@/lib/api-client`):
  cada funció crida el mètode i la ruta correctes; `unmarkWord` fa `encodeURIComponent` ("l'oxygène" → `l'oxyg%C3%A8ne`);
  el cos de `markWord` és `{"word": ...}`; `answerConcept` envia `{"answers": [...]}`.

### T3 — Protegir les pàgines amb login
- Fitxer: `web/lib/supabase/proxy-session.ts` (1 línia): `PROTECTED_PREFIXES = ["/dashboard", "/home", "/progress", "/class"]`.
- Anota a `docs/STATUS.md` › Requests: "Pau ha tocat proxy-session.ts (1 línia) per protegir /home, /progress i /class".
- Comprovació: sense sessió, `/home` redirigeix a `/login` (playwright-cli).

## Onada 2

### T4 — `/home`: clips i paraules amb dades reals
- Fitxers: `web/app/home/home-review.tsx`, `web/app/home/usable-words.ts` (+ test), `web/app/home/clip-card.tsx` i
  `clip-transcript.tsx` només si cal per a la traducció, `web/app/home/types.ts`, tests de `home-review.test.tsx`/`cards.test.tsx`.
- Carrega `getHomeReview()` un cop. Estat local de marques per clip: `Map<clipId, Set<word>>`, inicialitzat amb
  `words_to_practice` (`word` + `clip_id`) i actualitzat amb la resposta de `markWord`/`unmarkWord` (trampa 4).
- Tocar una paraula: si no està marcada → `markWord`; si ho està → `unmarkWord`. Actualització optimista + desfer si falla.
- La llista de paraules per practicar = `words_to_practice` + les marcades en aquesta visita (amb `translation_es` del `MarkResult`).
- Pràctica: `onFinish` → per cada resultat amb `lemma` no null → `savePractice({ lemma, clip_id, passed })`;
  paraules amb `lemma === null` no s'envien. Si `leveled_up` → es pot mostrar una petita celebració.
  Si falla (404 fins que la Laura fusioni) → no bloquegis; `console.error`.
- `usableWords` no peta amb `null` (trampa 1) + test.
- 0 clips → missatge "Hoy no tienes clips" (trampa 9).
- `audio_url` caducada → si l'àudio falla, recarrega `getHomeReview()` un cop (trampa 8).
- Fet quan: amb `lucia-w1`, marcar i desmarcar una paraula es manté després de recarregar la pàgina.

### T5 — `/home`: camí de conceptes (UI nova)
- Fitxers nous: `web/app/home/concepts/concept-list.tsx`, `concept-card.tsx`, `concept-flow.tsx` (diàleg: explicació + preguntes +
  resultat), `concept-flow-logic.ts` (pur: pas actual, respostes triades, si es pot comprovar), tests de cadascun.
  Modificat: `web/app/home/home-review.tsx` (només per afegir la secció i passar-li `review.concepts_to_learn`).
- Comportament i textos: `04-cami-conceptes-ui.md` (tot).
- Fet quan: amb `lucia-w4` es veu el concepte "Repasar", es pot recórrer l'explicació, respondre, i el resultat es mostra bé.
  (Compte: respondre-ho tot bé l'esborra de la BD de la demo; vegeu `05-dades-demo-i-proves.md`.)

### T6 — `/progress` amb dades reals
- Fitxers: `web/app/progress/page.tsx` (passa a renderitzar un client component), nou `web/app/progress/progress-view.tsx` (+ test).
- `progress-view.tsx` (`"use client"`): `getProgress()` a `useEffect`; carregant → "Cargando…"; error o 404 → "Aún no hay progreso";
  `ProgressHero` amb `learned_this_week` si existeix; la resta amb `ProgressMessage`.
- Test: amb 3 missatges en surt el hero + 2; sense `learned_this_week` no hi ha hero; error → missatge neutre; cap "%" a la pantalla.

## Onada 3

### T7 — Neteja i estat
- Cap import a `FAKE_REVIEW`, `getMyWords`, `saveMark`, `removeMark` (grep).
- `docs/STATUS.md`: actualitza NOMÉS la teva línia (Pau (D)).
- Esborra `docs/handoff/` del worktree (o no l'afegeixis al commit).

### T8 — Verificació
- `npm run lint`, `npx vitest run`, `npm run build` (amb `web/.env.local`).
- `playwright-cli`: captures de `05-dades-demo-i-proves.md` › Verificació final.
- `/unslop` + `web-design-guidelines` només a la secció nova de conceptes si hi ha temps.
