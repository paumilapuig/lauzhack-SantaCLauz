# 04 — Camí de conceptes a `/home` (UI nova)

## Per què existeix
A classe hi ha dos botons:
- **"No he entendido"** → dubte de **paraula** → clip d'àudio de 10 s → a casa: escoltar, marcar paraules, 7 modes de pràctica (ja ho tens).
- **"Me he perdido"** → dubte de **concepte** → només es desa el text de l'últim minut (cap àudio) → en acabar la classe,
  **1 sola crida a l'LLM** per sessió genera fins a 3 conceptes, cadascun amb una explicació visual pas a pas i 2–3 preguntes.

Són **dos camins d'aprenentatge separats**. A `/home` han de ser dues seccions diferents; mai barregis conceptes amb paraules.
Les respostes de la Lucía són el *feedback* del sistema: totes bé → `understood` (desapareix); alguna malament → `review` (es queda).
El profe veu cada concepte i el seu estat al seu panell.

## Dades
`GET /api/home/review` › `concepts_to_learn: ConceptGap[]` (vegeu `student-contract.ts`). Cada concepte:
- `concept`: títol curt en francès ("Pourquoi on a chaud pendant l'effort").
- `lesson_title`: "La respiration cellulaire".
- `explanation`: 3–5 passos `{ fr, es, visual }`. `visual` és un mini-diagrama d'emojis i fletxes (≤ 40 caràcters),
  p. ex. `"🏃 → 💪"`, `"🍞 + 💨 → 🔋"`.
- `exercises`: 2–3 preguntes `{ question, options }` (2–4 opcions). **Sense** la resposta.
- `status`: `"pending"` (nou) o `"review"` (ja ho va provar i en va fallar alguna).
- `lemmas`: paraules del glossari relacionades (opcional mostrar-les com a xips petits).

## On va
A `/home`, una secció nova **"Para entender mejor"**, separada de "De la clase" (clips) i de "Practicar" (paraules).
Proposta: sota els clips a mòbil; a escriptori pot anar a la columna principal després dels clips.
Si `concepts_to_learn` és buit → la secció no surt (o un missatge curt "Nada pendiente").

## Comportament (flux d'un concepte)
1. **Targeta tancada**: títol (`concept`), `lesson_title` petit, i una etiqueta d'estat:
   `pending` → "Nuevo" · `review` → "Repasar". Botó "Empezar".
2. **Explicació pas a pas** (dins un `Dialog` a pantalla completa a mòbil, com els teus modes de pràctica):
   - Un pas cada vegada. El `visual` gran (p. ex. 64–96 px) al centre; a sota `fr` (text principal) i `es` (més petit, gris).
   - Animació d'entrada del `visual` per a cada pas (fade + lleuger scale o slide; 200–300 ms).
     Respecta `prefers-reduced-motion` (sense animació).
   - Si el `visual` té fletxes (`→`), es pot animar per parts: primer el que hi ha abans de la fletxa, després la fletxa,
     després el resultat (split per `→`). Opcional, només si queda bé.
   - Botons "Anterior" / "Siguiente"; indicador de pas (punts, no "2/5" en text si vols ser coherent amb "mai números";
     aquí no és progrés de l'alumna, així que "Paso 2" també és acceptable).
   - Botó per escoltar `fr` amb `speechSynthesis` (`lang = "fr-FR"`), reutilitzant `web/app/home/speech.ts`.
   - Al final de l'explicació → "Comprobar" passa a les preguntes.
3. **Preguntes**: totes alhora o una per pantalla (tria la que quedi millor). Cada pregunta: `question` + `options`
   com a botons grans (mín. 44 px d'alt). La Lucía en tria una per pregunta. Botó "Comprobar" actiu quan totes tenen resposta.
4. **Enviar**: `POST /api/concepts/{id}/answers` amb `{ answers: [índex triat per pregunta, en ordre] }`.
5. **Resultat**:
   - Pinta cada pregunta segons `correct[i]` (bé / malament), sense revelar quina era la bona (el servidor no ho diu).
   - `status: "understood"` → missatge positiu ("¡Lo has entendido!"), botó "Cerrar"; en tancar, treu el concepte de la llista
     (actualització local; no cal recarregar).
   - `status: "review"` → missatge amable ("Casi. Vuelve a mirar la explicación"), botons "Ver explicación otra vez"
     (torna al pas 1 i esborra les respostes) i "Más tarde" (tanca; el concepte es queda amb `status` `review`).
   - Error `409` (ja era `understood`) → tracta-ho com a `understood`.
   - Error de xarxa / 5xx → "No se ha podido guardar. Inténtalo otra vez", sense perdre les respostes triades.

## Textos (castellà, la UI de l'alumna és en castellà)
- Secció: "Para entender mejor" · Subtítol: "Ideas de la clase, explicadas paso a paso."
- Etiquetes: "Nuevo", "Repasar" · Botons: "Empezar", "Anterior", "Siguiente", "Comprobar", "Ver explicación otra vez", "Más tarde", "Cerrar".
- Mai: "te perdiste", "no entendiste", minuts, percentatges.

## Accessibilitat
- Cada pas: el `visual` amb `aria-hidden="true"` (són emojis) i el text `fr` com a contingut real.
- Opcions de resposta: `role="radiogroup"` per pregunta, o botons amb `aria-pressed`.
- Resultat anunciat amb `role="status"`.
- Focus al títol del diàleg en obrir-lo; Escape tanca.

## Tests (Vitest + Testing Library, `// @vitest-environment jsdom`)
- Amb 1 concepte: surt la targeta amb el títol i "Nuevo"/"Repasar".
- "Siguiente" avança pas a pas; a l'últim pas surt "Comprobar".
- "Comprobar" de preguntes desactivat fins que totes tenen resposta.
- Envia `POST /api/concepts/{id}/answers` amb els índexs correctes (fetch fals).
- `understood` → el concepte desapareix de la llista; `review` → es queda i surt "Ver explicación otra vez".
- `concepts_to_learn: []` → la secció no surt.
- Cap text de la secció conté "perdi", "%" ni "minuto".
