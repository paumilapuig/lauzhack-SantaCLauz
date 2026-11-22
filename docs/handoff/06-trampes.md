# 06 — Trampes: coses que trencarien la pantalla (llegeix-ho abans de programar)

## 1. Ara hi ha `null` on el teu codi espera text 💥
L'API retorna `translation_es`, `definition_fr`, `lemma` i `level` a **`null`** per a paraules fora del glossari.
El teu codi actual assumeix que són `string`:
- `web/app/home/usable-words.ts:12` fa `(w[FIELD[need]] as string).trim()` → **peta** amb `null`
  ("Cannot read properties of null (reading 'trim')").
- `web/app/home/exercises/types.ts` → `PracticeWord` té `translation_es: string; definition_fr: string`.

**Solució:** una sola funció de conversió (p. ex. `toPracticeWord`) que passi de `WordToPractice` (API) al tipus intern,
amb `?? ""` als camps de text, i `usableWords` que tracti `null`/`""` com "no disponible". No escampis `?? ""` per tot arreu.

## 2. `lemma` ja no és la forma de la paraula
Avui `MyWord.lemma` fa de "paraula marcada" (forma de superfície: `déchets`). A l'API real:
- `word` = la forma tal com la va tocar (`déchets`) → és la que s'ha de pintar com a marcada al text i la que va a `DELETE`.
- `lemma` = el lema del glossari (`déchet`) o `null` → és el que va a `POST /api/practice`.
El conjunt `saved` de `home-review.tsx:36` (`new Set(words.map((w) => w.lemma))`) ha de passar a ser per **`word`** (i per clip).

## 3. Desmarcar necessita el clip
`removeMark(lemma)` no té el clip. L'endpoint real és `DELETE /api/clips/{clip_id}/marks/{word}`.
Guarda les marques com a parelles `(clip_id, word)`.

## 4. Una paraula marcada pot desaparèixer de `words_to_practice`
`words_to_practice` amaga les paraules del glossari amb `level ≥ 2`. Exemple: `mitochondrie` és transparent (nivell 3);
la Lucía la marca → nivell 2 → la marca existeix però **no surt** a `words_to_practice`.
Si `saved` només es construeix a partir de `words_to_practice`, la paraula sortirà com a "no marcada" i el següent toc
intentarà marcar-la una altra vegada (no passa res al servidor, però la UI no canvia).
**Solució:** manté un estat local de marques per clip, inicialitzat amb `words_to_practice` i actualitzat amb cada
resposta de `POST`/`DELETE /marks`. Després de marcar/desmarcar **no cal** tornar a cridar `/api/home/review`
(i millor no fer-ho a cada toc: és lent i regenera les URL d'àudio).

## 5. Traduccions: no hi ha diccionari al servidor
`translate(word)` (diccionari fix a `data.ts`) mostra una traducció per a **qualsevol** paraula abans de tocar-la.
L'API només dona traducció per a paraules del **glossari**, i només **després de marcar-les**
(`MarkResult.translation_es`) o a `words_to_practice`.
Recomanació (decideix tu el disseny):
- Paraula marcada: mostra `translation_es` de l'API; si és `null`, "sin traducción" (o res).
- Abans de tocar: no mostris traducció (és el que demana el producte: la Lucía toca el que no entén).
- Si vols mantenir el diccionari per a la demo, mou-lo a un fitxer amb nom explícit (`demo-dictionary.ts`) i fes-lo
  servir **només** com a pla B quan l'API retorna `null`. Mai per sobre del que diu l'API.

## 6. Pàgina de progrés és un server component
`web/app/progress/page.tsx` és `async` i crida `getProgress()` al servidor → no hi ha sessió del navegador →
l'API respon 401. Fes la crida des d'un client component (`"use client"` + `useEffect`), com fa `home-review.tsx`.

## 7. Errors de l'API
`POST /api/practice` i `GET /api/me/progress` ja són a `main` (PR #43), però la UI ha d'aguantar igualment qualsevol error.
- `/progress`: mostra un missatge neutre ("Aún no hay progreso") si falla, no una pantalla trencada.
- Pràctica: si `savePractice` falla, que l'exercici acabi igual (no bloquegis la Lucía) i registra l'error a la consola.

## 8. La URL d'àudio caduca
`audio_url` dura 1 hora. Si l'`<audio>` dona error de càrrega, torna a cridar `GET /api/home/review` un cop.

## 9. `lucia-w4` no té cap clip amb àudio
El clip de la demo de `lucia-w4` no té fitxer d'àudio → el servidor no el llista (`clips: []`), però les seves paraules
marcades (`déchets`, `chaleur`) **sí** surten a `words_to_practice`. La pantalla ha d'aguantar "0 clips" sense trencar-se
(missatge tipus "Hoy no tienes clips"). Per provar clips amb àudio, fes servir `lucia-w1` (té 2).

## 10. Res de "te has perdido"
El camí de conceptes **no ha de dir mai** a la Lucía que es va perdre ni quan. És una lliçó, no un retret.
Bé: "Para entender mejor", "Repasa esta idea". Malament: "No entendiste…", "Te perdiste en el minuto 12".
