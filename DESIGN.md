# DESIGN.md — Subtítols que es retiren

> Sistema visual del producte. Font de veritat per a `web/` (classe, casa, progrés, profe).
> El QUÈ és a `docs/PLAN.md`; els estats de paraula surten de `docs/API.md` › Rules.
> Tot el que no és aquí no existeix: si un component nou ho necessita, afegeix-ho aquí primer.

## 1. Principis

1. **La lectura mana.** La pantalla de classe és per llegir a 50–70 cm d'una tauleta mentre el profe parla. Text gran, línies curtes, res que es mogui sense motiu.
2. **L'ajuda és discreta i es retira.** Una paraula sense ajuda és text normal. L'ajuda no ha de cridar: subratllat + traducció petita, mai blocs de color sencers.
3. **Mai només color.** Cada estat de paraula té una forma pròpia (subratllat, icona). Ha de funcionar en escala de grisos i per a daltònics.
4. **Res de percentatges per a l'alumna.** Progrés = frases positives. Les xifres (autonomia) només al panell del profe.
5. **Un sol sistema.** Un estil de botó primari, un de secundari, una targeta, una escala de radis. Sense degradats, sense violeta/lavanda, sense ombres decoratives, sense emojis a la UI (els 🟢🟡🟠 dels docs són només notació interna).
6. **Calma.** Fons de paper càlid, tinta gairebé negra, un sol color de marca (verd petroli). Moviment curt (≤ 200 ms) i sempre amb `prefers-reduced-motion` respectat.

## 2. Colors (tokens)

Tots els parells de text compleixen **WCAG AA** (≥ 4.5:1; mesurat). Es defineixen a `web/app/globals.css` sobreescrivint les variables de shadcn i afegint les nostres.

| Token CSS | Valor | Ús | Contrast |
|---|---|---|---|
| `--background` | `#FAF8F3` | fons de pàgina (paper càlid) | — |
| `--card` | `#FFFFFF` | targetes, panell de subtítols | — |
| `--foreground` | `#1B1F24` | text principal | 15.6:1 sobre fons |
| `--muted-foreground` | `#4A525C` | text secundari, metadades | 7.5:1 |
| `--border` | `#D9D4C7` | vores d'1 px | (no és text) |
| `--primary` | `#0E5A63` | botó principal, enllaços, focus | blanc a sobre 7.9:1 |
| `--primary-foreground` | `#FFFFFF` | text sobre `--primary` | — |
| `--accent` | `#E3F0EF` | fons suau de selecció / estat actiu | `--primary` a sobre 6.8:1 |
| `--lost` | `#1B3A6B` | botó "Me he perdido" (blau tinta) | blanc a sobre 11.3:1 |
| `--word-yellow` | `#8A5300` | subratllat i traducció de l'estat groc | 6.0:1 sobre fons |
| `--word-yellow-bg` | `#FFF4D1` | ressalt de la paraula groga tocada (feedback) | tinta 15.1:1 |
| `--word-orange` | `#B03A0A` | subratllat doble + icona de l'estat taronja | 5.7:1 sobre fons |
| `--ring` | `#0E5A63` | anell de focus (2 px, offset 2 px) | — |

- No hi ha mode fosc (classe amb llum de dia). No hi ha color vermell d'error: els errors fan servir `--word-orange` + text que diu què passa.
- **Prohibit**: violeta/lavanda, degradats, colors saturats de fons de secció, `#000` pur.

## 3. Tipografia

- **Família única: Atkinson Hyperlegible** (Google Fonts, dissenyada per a baixa visió; distingeix bé `l/I/1`, `é/è`). Carregada amb `next/font/google` (`weight: ["400","700"]`), exposada com `--font-sans`. Fallback: `system-ui, sans-serif`.
- Pesos: 400 i 700. Res de cursives llargues. Sense tracking negatiu.

| Token | Mida (tauleta ≥ 768 px) | Mòbil | Line-height | Ús |
|---|---|---|---|---|
| `subtitle` | 36 px / 700 per a la frase actual | 28 px | 1.9 (deixa lloc a la traducció a sota) | frase que s'està dient |
| `subtitle-past` | 28 px / 400, `--muted-foreground` | 22 px | 1.8 | les 2 frases anteriors |
| `gloss` | 0.45 em de la paraula (≈ 16 px), 400 | igual | 1.1 | traducció castellana sota la paraula groga |
| `h1` | 32 px / 700 | 28 px | 1.2 | títol de pantalla |
| `h2` | 24 px / 700 | 22 px | 1.3 | títol de secció / targeta |
| `body` | 18 px / 400 | 18 px | 1.5 | text general (mai < 16 px) |
| `button-lg` | 22 px / 700 | 20 px | 1.2 | botons grans de classe |
| `button` | 18 px / 700 | 18 px | 1.2 | botons normals |
| `meta` | 16 px / 400, `--muted-foreground` | 16 px | 1.4 | dates, hores, etiquetes |

Amplada de línia dels subtítols: màx. **28 em** (~45 caràcters a 36 px).

## 4. Els 3 estats de paraula — component `Word`

Estat calculat per `web/lib/wordState.ts` (owner C). `Word` només el pinta. Les paraules fora del glossari són text pla, sense component.

| Estat | Significat | Aspecte | Accessibilitat |
|---|---|---|---|
| `green` | sense ajuda (transparent o dominada) | **cap marca**: idèntic al text normal | — |
| `yellow` | amb ajuda | subratllat **discontinu** 2 px `--word-yellow` (`text-decoration: underline dashed; text-underline-offset: 0.18em`) + **traducció castellana** a sota (`gloss`, `--word-yellow`, `lang="es"`) | `aria-describedby` → la traducció |
| `orange` | "te la vas perder" (tocada abans, encara no dominada) | subratllat **doble** 2 px `--word-orange` (`text-decoration: underline double`) + **icona** `History` de lucide (0.5 em, `--word-orange`) en superíndex a la dreta + traducció a sota com a groc | icona `aria-hidden`; `sr-only`: "ya la tocaste antes" |

Regles del component:
- Estructura: `<button class="word" data-state="yellow" lang="fr">` amb dos fills apilats en columna inline (`display: inline-flex; flex-direction: column; align-items: center`): la paraula i, si cal, la traducció. Així la traducció queda **centrada just a sota** de la paraula, sense trencar la línia.
- Tota paraula del glossari és un `<button>` (tocar = "no la entiendo"). Àrea tàctil mínima 44×44 px (padding vertical si cal). Les `green` també són tocables però sense cap pista visual.
- **Feedback en tocar**: fons `--word-yellow-bg` 600 ms i, si era `green`, passa a mostrar la traducció a sota (la paraula es converteix en groga a l'instant). Res de vibracions ni sons.
- Formes multi-paraula (`dioxyde de carbone`) són un sol `Word`; el subratllat cobreix tot el terme, la traducció va centrada sota el conjunt.
- Escala de grisos: groc = discontinu + text a sota; taronja = doble + icona. Es distingeixen sense color.

## 5. Components base (`web/components/ui/`)

Partim dels de shadcn ja instal·lats (`button`, `card`, `dialog`, `input`, `label`, `sonner`) i només en canviem tokens i mides.

### Botó (`Button`)
- Radi `--radius: 12px` per a tot (targetes 16 px = `rounded-xl`). Una sola escala.
- Variants: `default` (fons `--primary`, text blanc), `outline` (vora 2 px `--primary`, text `--primary`, fons `--card`), `ghost` (només text, per a accions terciàries). Res més.
- Mides: `default` alçada 48 px; **`xl` alçada 72 px**, amplada completa a mòbil, `button-lg`. Icona lucide a l'esquerra, 24 px, sempre amb text (mai botó només icona sense `aria-label`).
- Estats: hover → fons 8 % més fosc; press → `scale(0.98)`; focus → anell `--ring` 2 px + offset 2 px; disabled → opacitat 0.5 i `cursor: not-allowed`.

### Botons grans de classe
Barra fixa a baix de `/class`, dos botons `xl` costat a costat (apilats si < 480 px), separats 16 px:
- **"No he entendido"** — `default` (`--primary`), icona `Rewind`. Desa el clip dels últims 30 s.
- **"Me he perdido"** — fons `--lost`, text blanc, icona `CircleHelp`. Avisa al profe.
- Després de prémer: el botó mostra 2 s "Guardado" amb icona `Check` i no es pot tornar a prémer en aquest temps (evita dobles tocs). Toast de `sonner` només si falla la xarxa.

### Targeta (`Card`)
- Fons `--card`, vora 1 px `--border`, radi 16 px, padding 24 px (16 px a mòbil), **sense ombra**. Màxim dos nivells de caixa (targeta dins de pàgina, mai targeta dins targeta dins targeta).
- Si és clicable: tota la targeta és l'enllaç; hover → vora `--primary` i `translateY(-2px)`.

### Missatge de progrés (`ProgressMessage`)
- Targeta amb icona lucide a l'esquerra segons `kind`: `learned_this_week` → `Sprout`, `no_help_needed` → `BadgeCheck`, `keep_going` → `Footprints`. Icona 32 px en `--primary` sobre cercle `--accent`.
- Text `h2` en castellà, tal com ve de l'API. **Cap número del tipus "x de y", cap barra, cap %.**

## 6. Pantalles

Amplada de contingut: màx. 960 px centrada, marges laterals 24 px (16 px a mòbil). Espaiat en múltiples de 8 px (8 · 16 · 24 · 32 · 48).

### `/class` — alumna, en directe (UI en castellà)
- Capçalera fina (56 px): títol de la lliçó a l'esquerra (`meta`), indicador d'escolta a la dreta (punt `--primary` + "Escuchando"; punt gris + "En pausa"). El punt **no** parpelleja.
- Zona de subtítols: targeta blanca que ocupa l'espai disponible; la frase actual a baix en `subtitle`, les 2 anteriors a sobre en `subtitle-past`. El text nou entra sense animació (els resultats interims de Web Speech canvien massa).
- Barra inferior fixa amb els 2 botons grans (§5). Els subtítols tenen `padding-bottom` per no quedar mai tapats.
- Res més a la pantalla: ni menú ni comptadors.

### `/home` — alumna, a casa (castellà)
- `h1` "Para repasar". Llista de targetes de clip: títol de lliçó, hora (`meta`), transcripció curta amb els termes en `Word` estat groc, botó `default` "Escuchar" (icona `Play`).
- Dins d'un clip: reproductor nadiu (`<audio controls>`), la transcripció tocable, i les 3 activitats com a passos numerats 1–2–3 (una targeta per pas, el pas actiu amb vora `--primary`). Sense temporitzadors.
- Paraula superada: es mostra un instant sense subratllat amb el text "Ya no necesitas ayuda para *déchet*". Sense confeti.

### `/progress` — alumna (castellà)
- `h1` "Tu progreso". Llista vertical de `ProgressMessage`. Res més.

### `/teacher` — profe (UI en francès)
- Aquí sí hi ha xifres. Layout de 2 columnes ≥ 1024 px, 1 columna a sota.
- Targeta "Moments difficiles": barres horitzontals per minut (`lost_peaks`), color `--lost`, etiqueta "min 12" + nombre a la dreta. El pic més alt en negreta.
- Targeta "Mots les plus touchés": llista amb lema + nombre de tocs.
- Targeta per alumne: nom, autonomia actual en gran (`h1`, ex. "80 %") i evolució setmanal com a línia simple (`--primary`, punts marcats, eix de setmanes). Seguir la skill `dataviz` per al gràfic.

## 7. Moviment

- Durades: 120 ms (hover/press), 200 ms (canvi d'estat de paraula), 600 ms (ressalt en tocar). Easing `ease-out`.
- Cap animació en scroll, cap parpelleig, cap element que es mogui sol més de 5 s.
- `@media (prefers-reduced-motion: reduce)`: sense transformacions; els canvis són instantanis.

## 8. Accessibilitat (checklist abans de fer PR)

- [ ] Contrast AA de tot text nou (usa només els tokens de §2).
- [ ] Cada estat de paraula es distingeix en escala de grisos.
- [ ] Objectius tàctils ≥ 44×44 px; botons de classe 72 px d'alt.
- [ ] `lang="fr"` als subtítols, `lang="es"` a les traduccions i a la UI de l'alumna, `lang="fr"` a `/teacher`.
- [ ] Focus visible amb teclat a tots els controls; cap `tabindex` > 0.
- [ ] Icones decoratives `aria-hidden`; botons amb text visible.
- [ ] Res de percentatges ni "x de y" a `/class`, `/home`, `/progress`.
- [ ] Verificat amb captura de `playwright-cli` a 768×1024 (tauleta) i 390×844.

## 9. Textos fixos de la UI

| Lloc | Text |
|---|---|
| botó clip | No he entendido |
| botó perdut | Me he perdido |
| confirmació botó | Guardado |
| escoltant / pausa | Escuchando / En pausa |
| sr-only taronja | ya la tocaste antes |
| títol casa | Para repasar |
| títol progrés | Tu progreso |
| profe: moments | Moments difficiles |
| profe: paraules | Mots les plus touchés |
| profe: autonomia | Autonomie |
