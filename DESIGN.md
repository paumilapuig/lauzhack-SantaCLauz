# DESIGN.md — Subtítols que es retiren

> Sistema visual del producte. Font de veritat per a `web/` (classe, casa, progrés, profe).
> El QUÈ és a `docs/PLAN.md`; els estats de paraula surten de `docs/API.md` › Rules.
> Tot el que no és aquí no existeix: si un component nou ho necessita, afegeix-ho aquí primer.
> Estil: **escriptori d'editor** — sobri, precís, un sol accent segur (verd petroli). Referència d'estil: el sistema de Grammarly (només com a inspiració; cap logo, nom ni text seu a la UI).

## 1. Principis

1. **La lectura mana.** La pantalla de classe és per llegir a 50–70 cm d'una tauleta mentre el profe parla. Text gran, línies curtes, res que es mogui sense motiu.
2. **L'ajuda és discreta i es retira.** Una paraula sense ajuda és text normal. L'ajuda no ha de cridar: subratllat + traducció petita, mai blocs de color sencers.
3. **Mai només color.** Cada estat de paraula té una forma pròpia (subratllat, icona). Ha de funcionar en escala de grisos i per a daltònics.
4. **Res de percentatges per a l'alumna.** Progrés = frases positives. Les xifres (autonomia) només al panell del profe.
5. **Un sol sistema.** Un botó primari, un secundari, un ghost, una targeta, **un sol radi (8 px)**. Sense degradats, sense ombres, sense emojis a la UI (els 🟢🟡🟠 dels docs són només notació interna).
6. **Pla com el paper.** Fons blanc, tinta blau nit, el 90 % de la pantalla acromàtic. El verd petroli només per a acció: botó principal, enllaços, estat actiu, focus. Les capes se separen amb vores fines d'1 px, mai amb ombres.

## 2. Colors (tokens)

Tots els parells de text compleixen **WCAG AA** (≥ 4.5:1; mesurat). Es defineixen a `web/app/globals.css` sobreescrivint les variables de shadcn i afegint les nostres. Només tema clar.

| Token CSS | Valor | Ús | Contrast |
|---|---|---|---|
| `--background` | `#FFFFFF` | fons de pàgina (paper) | — |
| `--surface` | `#F5F5F5` | seccions alternes, hover suau, panells secundaris | — |
| `--card` | `#FFFFFF` | targetes, panell de subtítols (amb vora) | — |
| `--foreground` | `#1F243C` | text principal (blau nit) | 15.3:1 |
| `--heading` | `#0E101A` | títols i text de màxima èmfasi | 19.0:1 |
| `--muted-foreground` | `#545454` | text secundari, ajuda, metadades | 7.6:1 |
| `--subtle-foreground` | `#707070` | text terciari, etiquetes desactivades | 5.0:1 |
| `--border` | `#EBEBEB` | vores fines de targetes i separadors | (no és text) |
| `--input` | `#D9D9D9` | vores de camps, divisors més marcats | (no és text) |
| `--primary` | `#027E6F` | botó principal, enllaços, pestanya activa, focus | blanc a sobre 5.0:1 |
| `--primary-hover` | `#026058` | hover del botó principal | blanc a sobre 7.5:1 |
| `--primary-foreground` | `#FFFFFF` | text sobre `--primary` | — |
| `--accent` | `#F2F8F7` | fons suau d'estat actiu / selecció | `--primary` a sobre 4.6:1 |
| `--lost` | `#1B3A6B` | botó "Me he perdido" (blau tinta) | blanc a sobre 11.3:1 |
| `--word-yellow` | `#8A5300` | subratllat i traducció de l'estat groc | 6.3:1 |
| `--word-yellow-bg` | `#FFF4D1` | ressalt de la paraula tocada (feedback) | tinta 17.3:1 |
| `--word-orange` | `#B03A0A` | subratllat doble + icona de l'estat taronja | 6.1:1 |
| `--ring` | `#027E6F` | anell de focus (2 px, offset 2 px) | — |

- Els tres colors de paraula (`--word-yellow`, `--word-orange`) i `--lost` són **funcionals**, no decoratius: són l'única excepció a "un sol accent".
- Sense color vermell d'error: els errors fan servir `--word-orange` + text que diu què passa.
- **Prohibit**: degradats, ombres, fons de secció saturats, verd petroli sobre verd petroli, `#000` pur, un segon to de verd.

## 3. Tipografia

- **Títols: Manrope 700** (substitut lliure de la display geomètrica de referència), tracking `-0.01em`, només a mides ≥ 20 px.
- **Text i UI: Inter 400/700**, `font-feature-settings: "cv08", "ss01"`. Xifres amb `tabular-nums`.
- Carregades amb `next/font/google`, exposades com `--font-heading` i `--font-sans`. Fallback: `system-ui, sans-serif`.
- Mai Manrope a ≤ 16 px. Mai text visible < 14 px.

| Token | Família | Mida (tauleta ≥ 768 px) | Mòbil | Line-height | Ús |
|---|---|---|---|---|---|
| `subtitle` | Inter 700 | 36 px | 28 px | 1.9 (lloc per a la traducció) | frase que s'està dient |
| `subtitle-past` | Inter 400, `--muted-foreground` | 28 px | 22 px | 1.8 | les 2 frases anteriors |
| `gloss` | Inter 400 | 0.45 em de la paraula (≈ 16 px) | igual | 1.1 | traducció castellana sota la paraula |
| `display` | Manrope 700 | 52 px, `-0.52px` | 36 px | 1.09 | xifra gran (profe, `/progress`) |
| `h1` | Manrope 700 | 36 px, `-0.36px` | 28 px | 1.12 | títol de pantalla |
| `h2` | Manrope 700 | 22 px | 20 px | 1.2 | títol de secció / targeta |
| `subheading` | Inter 700 | 20 px | 18 px | 1.25 | subtítols de secció |
| `body` | Inter 400 | 16 px | 16 px | 1.5 | text general |
| `body-sm` | Inter 400 | 14 px | 14 px | 1.45 | ajuda, descripcions curtes |
| `button-lg` | Inter 700 | 22 px | 20 px | 1.2 | botons grans de classe |
| `button` | Inter 700 | 16 px | 16 px | 1.2 | botons normals |
| `meta` | Inter 400, `--muted-foreground` | 14 px | 14 px | 1.45 | dates, hores, etiquetes |

Amplada de línia dels subtítols: màx. **28 em** (~45 caràcters a 36 px).

## 4. Els 3 estats de paraula — component `Word`

Estat calculat per `web/lib/wordState.ts` (owner C). `Word` només el pinta. Les paraules fora del glossari són text pla, sense component.

| Estat | Significat | Aspecte | Accessibilitat |
|---|---|---|---|
| `green` | sense ajuda (transparent o dominada) | **cap marca**: idèntic al text normal | — |
| `yellow` | amb ajuda | subratllat **discontinu** 2 px `--word-yellow` (`text-decoration: underline dashed; text-underline-offset: 0.18em`) + **traducció castellana** a sota (`gloss`, `--word-yellow`, `lang="es"`) | `aria-describedby` → la traducció |
| `orange` | "te la vas perder" (marcada abans a casa, encara no dominada) | subratllat **doble** 2 px `--word-orange` (`text-decoration: underline double`) + **icona** `History` de lucide (0.5 em, `--word-orange`) en superíndex a la dreta + traducció a sota com a groc | icona `aria-hidden`; `sr-only`: "ya la marcaste antes" |

Regles del component:
- Estructura: `<span class="word" data-state="yellow" lang="fr">` amb dos fills apilats en columna inline (`display: inline-flex; flex-direction: column; align-items: center`): la paraula i, si cal, la traducció. La traducció queda **centrada just a sota** de la paraula, sense trencar la línia.
- A classe les paraules **no es toquen** (es marquen a casa, al clip). Al clip de casa cada paraula és un `<button>` amb àrea tàctil mínima 44×44 px.
- **Feedback en marcar (casa)**: fons `--word-yellow-bg` 600 ms i apareix la traducció a sota. Res de vibracions ni sons.
- Formes multi-paraula (`dioxyde de carbone`) són un sol `Word`; el subratllat cobreix tot el terme, la traducció va centrada sota el conjunt.
- Escala de grisos: groc = discontinu + text a sota; taronja = doble + icona. Es distingeixen sense color.

## 5. Components base (`web/components/ui/`)

Partim dels de shadcn ja instal·lats (`button`, `card`, `dialog`, `input`, `label`, `sonner`) i només en canviem tokens i mides. **Radi únic `--radius: 8px`** per a botons, camps, etiquetes, targetes i fulles. Mai pastilles (`9999px`) ni radis ≥ 20 px. **Sense `box-shadow`** enlloc.

### Botó (`Button`)
- Variants (res més):
  - `default`: fons `--primary`, text blanc, sense vora; hover → `--primary-hover`.
  - `outline`: fons `--card`, vora 1 px `--heading`, text `--heading`; hover → fons `--surface`.
  - `ghost`: només text `--foreground` (o `--primary` si és un enllaç); hover → fons `--surface`.
- Mides: `default` alçada 48 px, padding `12px 24px`, `button`; **`xl` alçada 72 px**, amplada completa a mòbil, `button-lg`. Icona lucide 20 px a l'esquerra (fletxa `ArrowRight` a la dreta només a l'acció principal d'una pantalla), sempre amb text visible o `aria-label`.
- Estats: press → `scale(0.98)`; focus → anell `--ring` 2 px + offset 2 px; disabled → text `--subtle-foreground`, vora `#B7B7B7`, `cursor: not-allowed`.

### Botons grans de classe
Barra fixa a baix de `/class`, dos botons `xl` costat a costat (apilats si < 480 px), separats 16 px:
- **"No he entendido"** — `default` (`--primary`), icona `Rewind`. Desa el clip dels últims 30 s.
- **"Me he perdido"** — fons `--lost`, text blanc, icona `CircleHelp`. Avisa al profe.
- Després de prémer: el botó mostra 2 s "Guardado" amb icona `Check` i no es pot tornar a prémer en aquest temps. Toast de `sonner` només si falla la xarxa.

### Targeta (`Card`)
- Fons `--card`, vora 1 px `--border`, radi 8 px, padding 32 px (16 px a mòbil), **sense ombra**. Màxim dos nivells de caixa.
- Si és clicable: tota la targeta és l'enllaç; hover → vora `--input` i fons `--surface`. Sense desplaçaments.

### Missatge de progrés (`ProgressMessage`)
- Fila amb icona de línia lucide 24 px en `--primary` a l'esquerra segons `kind`: `learned_this_week` → `Sprout`, `no_help_needed` → `BadgeCheck`, `keep_going` → `Footprints`. Sense cercles de color.
- Text `subheading` en castellà, tal com ve de l'API. **Cap número del tipus "x de y", cap barra, cap %.**

## 6. Pantalles

Amplada de contingut: màx. 1200 px centrada (880 px per a text llarg), marges laterals 24 px (16 px a mòbil). Espaiat en múltiples de 8 px (8 · 16 · 24 · 32 · 48 · 64 · 80). Alineació a l'esquerra; centrat només en estats buits i fulles modals.

### `/class` — alumna, en directe (UI en castellà)
- Capçalera fina (64 px, vora inferior 1 px `--border`): títol de la lliçó a l'esquerra (`meta`), indicador d'escolta a la dreta (punt `--primary` + "Escuchando"; punt `--subtle-foreground` + "En pausa"). El punt **no** parpelleja.
- Zona de subtítols: targeta blanca que ocupa l'espai disponible; la frase actual a baix en `subtitle`, les 2 anteriors a sobre en `subtitle-past`. El text nou entra sense animació (els resultats interims de Web Speech canvien massa).
- Barra inferior fixa amb els 2 botons grans (§5), vora superior 1 px `--border`. Els subtítols tenen `padding-bottom` per no quedar mai tapats.
- Res més a la pantalla: ni menú ni comptadors.

### Casa (`/home`, `/progress`)
Especificacions anteriors: `docs/specs/home-apple-hig.md`, `docs/specs/home-unslop.md` (estructura vàlida; colors i tipus els mana aquest fitxer).
- **Direcció**: escoltar de nou la classe. Caràcter: tranquil, atent. **Moment**: el reproductor del clip (ona gran de la veu del profe). **Signatura**: la marca `--word-yellow` = "paraula que has marcat" (subratllat a la transcripció, agulla a l'ona, punt a la llista). Enlloc més.
- **Shell**: ≥ 1024 px barra lateral de 256 px (fons `--surface`, marca "Fondu", Repasar / Progreso amb l'actiu en `--accent` i text `--primary`, i "Tus palabras" compacta); < 1024 px barra de pestanyes a baix (fons blanc, vora superior 1 px `--border`).
- **Títol**: nom de la pàgina en `h1` + context en `--muted-foreground` a la mateixa línia ("Repasar · sábado 21", "Progreso · esta semana"). Etiquetes de secció en `subheading` amb el recompte en `tabular-nums`.
- **Color**: tot acromàtic; `--primary` només a la pestanya activa, als enllaços i a l'acció principal d'una fulla. Play en `--heading`. Icones de línia 20 px en `--muted-foreground`, sense requadres de color.
- **Formes**: seccions sense caixa, separades amb vores 1 px `--border`; radi 8 px només a controls, targetes i la fulla modal.

### `/home` — alumna, a casa (castellà)
- **Clip**: títol de la lliçó + meta; **la transcripció primer** (karaoke: la paraula que sona en negreta, la resta en `--muted-foreground`; cada paraula amb el seu apòstrof i puntuació no es parteix de línia); després play/pausa en `--heading` i l'**ona** (h-16, la part sonada en `--heading`, capçal, agulles `--word-yellow` amb la paraula en `meta` sota), temps en `tabular-nums`, arrossegable.
- **Marcar paraules**: només als clips de casa; tocar = traducció + es desa (groc, a `clip_marks`); tornar a tocar = es treu.
- **Tus palabras**: punt `--word-yellow`, paraula + traducció; X per treure amb "Quitada · Deshacer" 5 s.
- **Practicar**: files en 2 columnes (icona de línia, nom, una línia de descripció en `body-sm`). El mode s'obre en una **fulla modal** (`Dialog`; pantalla completa al mòbil), "Cerrar"/Esc sense desar; pantalla final sense números.

### `/progress` — alumna (castellà)
- La xifra de la setmana en `display` `--primary` (recompte, mai un %) i la frase sencera; la resta com a files `ProgressMessage`.

### `/teacher` — profe (UI en francès)
- Aquí sí hi ha xifres. Layout de 2 columnes ≥ 1024 px, 1 columna a sota.
- Targeta "Moments difficiles": barres horitzontals per minut (`lost_peaks`), color `--lost`, etiqueta "min 12" + nombre a la dreta. El pic més alt en negreta.
- Targeta "Mots les plus marqués": llista amb lema + nombre de marques.
- Targeta per alumne (estil "stat card"): nom, autonomia actual en `display` `--primary` (ex. "80 %") i evolució setmanal com a línia simple (`--primary`, punts marcats, eix de setmanes). Seguir la skill `dataviz` per al gràfic.

## 7. Moviment

- Durades: 120 ms (hover/press), 200 ms (canvi d'estat de paraula), 600 ms (ressalt en marcar). Easing `ease-out`.
- Cap animació en scroll, cap parpelleig, cap element que es mogui sol més de 5 s.
- `@media (prefers-reduced-motion: reduce)`: sense transformacions; els canvis són instantanis.

## 8. Accessibilitat (checklist abans de fer PR)

- [ ] Contrast AA de tot text nou (usa només els tokens de §2).
- [ ] Cada estat de paraula es distingeix en escala de grisos.
- [ ] Objectius tàctils ≥ 44×44 px; botons de classe 72 px d'alt.
- [ ] Cap text visible < 14 px; Manrope només ≥ 20 px.
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
| sr-only taronja | ya la marcaste antes |
| títol casa | Para repasar |
| títol progrés | Tu progreso |
| profe: moments | Moments difficiles |
| profe: paraules | Mots les plus marqués |
| profe: autonomia | Autonomie |
