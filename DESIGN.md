# DESIGN.md — Subtítols que es retiren

> Sistema visual del producte. Font de veritat per a `web/` (classe, casa, progrés, profe).
> El QUÈ és a `docs/PLAN.md`; els estats de paraula surten de `docs/API.md` › Rules.
> Tot el que no és aquí no existeix: si un component nou ho necessita, afegeix-ho aquí primer.
> Estil: **retiro solar sobre paper càlid** — crema `#f9f4f2`, pastilles suaus, un sol accent blau d'acció (`#0061ef`), groc sunbeam com a puntuació emocional. Referència visual: Headspace (només com a inspiració; cap logo, nom ni text seu a la UI).

## 0. Capa visual «vídeo» (Sun 22 Nov) — mana sobre §2, §5 i §7 si hi ha conflicte

Regla: el **taronja** diu «Loop'd està aprenent», el **teal** diu «ho has aconseguit». Mai els dos al mateix element.

| Token (`web/app/globals.css`) | Hex | Rol |
|---|---|---|
| `--brand-orange` (+ `--brand-orange-soft` #FEF2EA) | #F47D31 | marca i aprenentatge: logo, xips de pas, píndoles de nivell, línies de progrés, «+1», play, ona reproduïda, icones dels jocs |
| `--primary` (teal) + `--primary-soft` | #027E6F · #F2F8F7 | èxit: «No help needed», resposta correcta, check, bàner de pujada de nivell, anell de focus |
| `--word-yellow` / `--word-yellow-bg` | #8A5300 · #FFF4D1 | ajuda activa: traducció, paraula marcada (/home: fons groc radi 10), «Almost» |
| `--lost` (+ `--lost-soft`) | #1B3A6B | «Je n'ai pas compris» i l'etiqueta «A word you missed» |
| `--heading` / `--charcoal` (ink) | #0E101A | títols, botons d'acció (Check, Next, Done, Start), «J'ai perdu le fil», toasts |
| `--label` · `--label-secondary` · `--subtle` | #1F243C · #545454 · #707070 | text, secundari, etiquetes |
| `--background`/`--fill` · `--border` · `--input` (`--input-hover` #BDBDBD) | #F5F5F5 · #EBEBEB · #D9D9D9 | fons, vores, vores d'opcions |

- **Tipografia:** títols bold, tracking −0.01em. Etiqueta de secció en majúscules 12–13 px bold `--subtle` (TODAY'S PLAN, FROM CLASS, WHAT LOOP'D KNOWS). Cos 16–18 px; xifres `tabular-nums`.
- **Forma:** targetes blanques, vora 1 px `--border`, radi 16 (principal 24), **sense ombres ni degradats**. Píndoles totalment arrodonides, bold 13–14 px.
- **Opcions de joc** (`web/app/home/exercises/controls.tsx` › `AnswerOption`): 96 px d'alt (mòbil ≥ 56), vora 2 px `--input`, radi 16; hover → `--input-hover` + fons `--fill`; correcta → fons `--primary-soft`, vora i text teal, check a la dreta; errada → sacseig curt (`animate-nudge`) i text `--subtle`. `ActionButton` (pastilla 56 px, ink/teal/soft) i `FeedbackBar` (teal si encerta, groc d'ajuda si no, sempre amb «Next»).
- **Components** (`web/components/ui/`): `CheckBadge` (cercle teal + check, entra amb rebot), `StepChip` (cercle taronja amb número), `LevelMeter` («What Loop'd knows»: paraula display, 3 píndoles de 22 px, «Level N of 3», `StatusPill` «Help on: …» groc / «No help needed» teal), `LevelUpBanner` (bloc teal radi 24: «You no longer need / help with X» — el moment principal de /home: els medidors esperen 500 ms), toast (`sonner`: píndola ink, check teal, text blanc bold).
- **/home** (`web/app/home/`): a dalt la **feina per avui** (`study-plan-view.tsx`: clips → conceptes → un joc; els passos fets queden ratllats amb check i no tornen a la llista de pendents), i a sota un **interruptor lliscant «Vocab / Context»** (sempre al mateix lloc: el text d'introducció és el mateix a les dues pestanyes i `scrollbar-gutter: stable`) (`review-switch.tsx`, `role="tablist"`, fletxes del teclat, número de pendents a cada costat). **Vocab** = només els clips (Discard + Done) i la llista de jocs al costat; quan tots els clips estan fets, els jocs ocupen tota la pantalla en blocs grans, amb el joc suggerit primer i ample («For you», `suggested-game.ts`: el nivell de les paraules més febles decideix el joc; els jocs fets avui porten «Done today» i el suggeriment passa al següent). **Context** = els conceptes de classe (diagrama). En acabar un joc: resum amb `LevelMeter` i, si una paraula arriba a nivell 2, el bàner.
- **Moviment** (utilitats a `globals.css`): `animate-rise` (fade + puja 40 px, 450 ms ease-out cúbic; llistes escalonades 100 ms amb `--i`), `animate-pop` (0,6 → 1 easeOutBack), `animate-pulse-once` (1,25 → 1, píndola nova), `animate-plus-one` («+1», 1 s), `animate-nudge` (resposta errada, 320 ms). Botó premut: escala 0,96. `prefers-reduced-motion`: cap animació ni transició.
- **To:** frases curtes, segona persona, en positiu («You no longer need help with déchet», «Almost. Try again.»). L'alumna no veu mai un percentatge.

## 1. Principis

1. **La lectura mana.** La pantalla de classe és per llegir a 50–70 cm d'una tauleta mentre el profe parla. Text gran, línies curtes, res que es mogui sense motiu.
2. **L'ajuda és discreta i es retira.** Una paraula sense ajuda és text normal. L'ajuda no ha de cridar: subratllat + traducció petita, mai blocs de color sencers.
3. **Mai només color.** Cada estat de paraula té una forma pròpia (subratllat, icona). Ha de funcionar en escala de grisos i per a daltònics.
4. **Res de percentatges per a l'alumna.** Progrés = frases positives. Les xifres (autonomia) només al panell del profe.
5. **Un sol sistema.** Un botó primari blau (una sola acció màxima per vista), un secundari fosc (pastilla amb ombra «sticker»), un ghost, targetes blanques sobre crema. Pastilles (`800px`) a botons i filtres; targetes a `16px`; featured a `24–32px`.
6. **Paper càlid.** Fons crema `#f9f4f2`, targetes blanques, tinta càlida `#2d2c2b` (mai `#000` al cos). El color cromàtic és puntuació: blau d'acció, groc sunbeam, taronja del punt de marca, violetes només en moments contemplatius / il·lustració.

## 2. Colors (tokens)

Tots els parells de text compleixen **WCAG AA** (≥ 4.5:1; mesurat). Es defineixen a `web/app/globals.css`. Només tema clar.

| Token CSS | Valor | Ús |
|---|---|---|
| `--background` / `--color-page-cream` | `#f9f4f2` | fons de pàgina (paper càlid) |
| `--card` / `--color-pure-white` | `#ffffff` | targetes, panells, inputs |
| `--foreground` / `--color-charcoal-ink` | `#2d2c2b` | text principal |
| `--heading` / `--color-soft-black` | `#000000` | títols display de màxima èmfasi |
| `--muted-foreground` / `--color-graphite` | `#44423f` | text secundari, icones |
| `--subtle-foreground` / `--color-stone` | `#63605d` | text terciari, footer, disabled |
| `--border` / `--color-linen` | `#e2ded9` | vores de targetes i separadors |
| `--input` / `--color-ash` | `#d0d0d0` | vores de camps |
| `--primary` / `--color-mindful-blue` | `#0061ef` | **única** CTA principal per vista |
| `--primary-foreground` | `#ffffff` | text sobre `--primary` |
| `--charcoal` | `#2d2c2b` | botó fosc secundari (pastilla) |
| `--sunbeam` / `--color-sunbeam-yellow` | `#ffce00` | banner, highlights, puntuació |
| `--brand-orange` / `--color-brand-orange` | `#f47d31` | punt de la marca «Loop'd» (sempre a dalt a l'esquerra) |
| `--deep-indigo` | `#3b197f` | moments contemplatius / fills d'il·lustració |
| `--lost` | `#1B3A6B` | botó «J'ai perdu le fil» (funcional) |
| `--word-yellow` | `#8A5300` | subratllat i traducció estat groc |
| `--word-yellow-bg` | `#FFF4D1` | feedback en marcar |
| `--word-orange` | `#B03A0A` | subratllat doble + icona estat taronja |
| `--ring` | `#0061ef` | anell de focus |
| `--shadow-subtle` | `rgba(65, 61, 69, 0.2) 0px 2px 0px 0px` | ombra «sticker» dels botons foscos |

Aliases de compatibilitat (casa): `--label` = charcoal, `--label-secondary` = graphite, `--fill` = white-on-cream hover (`#ffffff` / linen suau), `--fill-strong` = linen, `--separator` = linen, `--marker-strong` = sunbeam.

- Els colors de paraula i `--lost` són **funcionals**, no decoratius.
- **Prohibit**: un segon botó blau a la mateixa vista; ombres fortes a targetes; radis aguts (0–4 px); `#000` al cos de text; tema fosc.

## 3. Tipografia

- **Família única: Plus Jakarta Sans** (substitut lliure de Headspace Apercu), pesos 400 / 500 / 700. Tracking negatiu que s'estreny amb la mida.
- Carregada amb `next/font/google` com `--font-sans` / `--font-heading`. Fallback: `system-ui, sans-serif`.
- OpenType: `"ss01", "cv11"`. Xifres amb `tabular-nums`.
- Mai text visible < 14 px.

| Token | Pes | Mida (tauleta ≥ 768 px) | Mòbil | Line-height | Tracking | Ús |
|---|---|---|---|---|---|---|
| `subtitle` | 700 | 36 px | 28 px | 1.9 | −0.03em | frase en directe |
| `subtitle-past` | 400, graphite | 28 px | 22 px | 1.8 | −0.01em | 2 frases anteriors |
| `gloss` | 400 | 0.45 em (~16 px) | igual | 1.1 | — | traducció ES |
| `display` | 700 | 52–72 px | 36 px | 1.1–1.13 | −0.03em | xifra gran (profe, `/progress`) |
| `h1` / `heading-lg` | 700 | 40 px | 28 px | 1.29 | −1 px | títol de pantalla |
| `h2` / `heading` | 700 | 32 px | 24 px | 1.3 | −0.8 px | secció |
| `subheading` | 500 | 20 px | 18 px | 1.33 | −0.5 px | subtítols |
| `body` | 400 | 16 px | 16 px | 1.5 | −0.16 px | text general |
| `body-sm` | 400 | 14 px | 14 px | 1.5 | −0.14 px | ajuda |
| `button` | 700 | 16 px | 16 px | 1.2 | — | botons |
| `button-lg` | 700 | 22 px | 20 px | 1.2 | — | botons de classe |
| `meta` / `caption` | 400, graphite | 14 / 12 px | igual | 1.5 | — | dates, etiquetes |

Amplada de línia dels subtítols: màx. **28 em**.

## 4. Els 3 estats de paraula — component `Word`

> **Estat final (diumenge 22):** els subtítols de `/class` són **text pla** (decisió d'equip): els estats es calculen a
> `web/lib/wordState.ts` i es desen per a l'autonomia, però **no es pinten a classe**. Aquesta taula queda com a
> especificació si mai es tornen a mostrar; a casa la traducció ES fa servir `--word-yellow`.

Estat calculat per `web/lib/wordState.ts` (owner C). `Word` només el pinta. Les paraules fora del glossari són text pla.

| Estat | Significat | Aspecte | Accessibilitat |
|---|---|---|---|
| `green` | sense ajuda | **cap marca**: idèntic al text normal | — |
| `yellow` | amb ajuda | subratllat **discontinu** 2 px `--word-yellow` + traducció ES a sota | `aria-describedby` → traducció |
| `orange` | «te la vas perder» | subratllat **doble** 2 px `--word-orange` + icona `History` + traducció | `sr-only`: «ya la marcaste antes» |

Regles:
- Estructura: `<span class="word" data-state="…" lang="fr">` amb fills en columna inline.
- A classe les paraules **no es toquen**. Al clip de casa cada paraula és un `<button>` ≥ 44×44 px.
- Feedback en marcar: fons `--word-yellow-bg` 600 ms.
- Formes multi-paraula = un sol `Word`.

## 5. Components base (`web/components/ui/`)

### Botó (`Button`)
- Variants:
  - `default` (primari blau): fons `--primary`, text blanc, radi pastilla `800px`, padding `12px 24px`, pes 700. **Una sola** per vista.
  - `secondary` / fosc: fons charcoal o soft-black, text blanc, pastilla, ombra `--shadow-subtle` (sticker).
  - `outline`: fons blanc, vora 1 px linen, text charcoal; hover → fill suau.
  - `ghost`: només text charcoal/graphite; hover → fill suau.
- Mides: `default` alçada 48 px; **`xl`** 72 px (classe). Press → `scale(0.98)`; focus → anell `--ring` 2 px + offset 2 px.

### Botons grans de classe (`web/app/class/ClassActionButton.tsx`)
Mentre la classe està en marxa, els dos botons ocupen gairebé tota la pantalla sota els subtítols (costat a costat ≥ 768 px, apilats en mòbil), gap 16 px, radi 32 px, text 48 px (32 px mòbil), **en francès** (la llengua que l'alumna aprèn):
- **«Je n'ai pas compris»** — fons `--primary` (blau), icona `Rewind`.
- **«J'ai perdu le fil»** — fons `--lost`, text blanc, ombra sticker, icona `CircleHelp`.
- Després de prémer: toast `sonner` a dalt a l'esquerra que desapareix sol (2,5 s): «Extrait enregistré» / «Moment enregistré»; si falla, «Pas pu enregistrer».

### Interruptor «Sous-titres» (`web/app/class/SubtitleSwitch.tsx`)
- Petit interruptor pastilla (`role="switch"`) a dalt a la dreta de `/class`. Actiu = charcoal (el blau queda per al botó principal). Només amaga el text; el reconeixement continua.

### Targeta (`Card`)
- Fons blanc, vora 1 px linen (o sense vora si el contrast crema/blanc basta), radi **16 px**, padding 32–48 px. Featured: radi 24–32 px. Sense ombra forta.
- Clicable: hover → vora ash / fill suau.

### Filter pill
- Actiu: charcoal, text blanc, pastilla, punt blanc.
- Inactiu: blanc, vora linen, text charcoal.

### Missatge de progrés (`ProgressMessage`)
- Fila amb icona lucide 24 px en graphite; text `subheading` en anglès (UI de l'alumna en anglès des del PR #46). **Cap %**, cap «x de y», cap barra.

### Marca
- Punt taronja `#f47d31` + wordmark «Loop'd» en charcoal a dalt a l'esquerra de cada shell d'alumna.

## 6. Pantalles

Amplada de contingut: màx. **1200 px** (880 px text llarg), marges 24 px (16 px mòbil). Gaps de secció **64 px**; entre targetes 24–32 px. Alineació a l'esquerra; centrat només buits i modals.

### `/class` — alumna, en directe
1. Shell compartit: Loop'd (enllaça a `/dashboard`, «Today») + nav **Class · Review · Progress** (sense tabbar mentre la classe està en marxa).
2. Abans de començar: títol «Cours» + lead + targeta amb «Commencer le cours» (tot `/class` és en francès). Indicadors: micro («Son : bon / faible / trop fort») i estat («En direct / Reconnexion… / Hors ligne»); pla B «Lire le texte de la leçon».
3. En marxa: interruptor «Sous-titres» a dalt a la dreta; **una sola línia** de subtítols gran (52 px / 32 px mòbil, `lang="fr"`) dins d'una targeta blanca — les paraules noves entren per la dreta, les velles s'esvaeixen per l'esquerra, i la línia desapareix després de 4 s de silenci. Sense 🟢🟡🟠 a classe (els colors són per a casa).
4. Els dos botons grans omplen la resta de la pantalla. Els desats són toasts, no cap llista.

### Casa (`/home`, `/progress`)
- **Direcció**: escoltar de nou. Caràcter: tranquil, atent, càlid.
- **Shell**: capçalera superior sticky (marca esquerra, pastilles **Clase · Repasar · Progreso** a la dreta) sobre blanc; contingut centrat a màx. 1200 px. < 1024 px: mateixa capçalera + tabbar inferior (3 pestanyes). A `/class` la nav va sempre a la capçalera (sense tabbar mentre hi ha els botons grans).
- **Títol**: `h1` + context + una línia de lead. Sense llista «Tus palabras» — les marques es desen i es veuen al clip.
- **Signatura**: `--word-yellow` = paraula marcada (subratllat + agulla a l'ona).

### `/home`
- Layout ≥ lg: **2 columnes** — clips (escenari principal) + rail sticky «Practicar» (280 px).
- Cada clip: meta «Clip N · lliçó», transcripció gran, **dock** inferior amb play + ona (no reproductor al costat del text).
- Practicar: llista vertical compacta dins d'una targeta; s'obre en fulla modal.

### `/progress`
- Xifra setmanal en `display` (recompte, mai %); resta com a files `ProgressMessage`.

### `/teacher` — profe (francès)
- Aquí sí hi ha xifres. 2 columnes ≥ 1024 px. Moments difficiles (`--lost`), mots marqués, autonomia per alumne.

### Login / dashboard
- Sobre crema; targeta blanca radi 16; CTA blava pastilla única.

## 7. Moviment

- 120 ms hover/press, 200 ms estat de paraula, 600 ms ressalt. Easing `ease-out`.
- Cap scroll-linked, cap parpelleig, cap loop > 5 s.
- `@media (prefers-reduced-motion: reduce)`: sense transformacions.

## 8. Accessibilitat (checklist abans de PR)

- [ ] Contrast AA (tokens §2).
- [ ] Estats de paraula distingeixen en escala de grisos.
- [ ] Objectius tàctils ≥ 44×44 px; botons de classe 72 px d'alt.
- [ ] Cap text visible < 14 px.
- [ ] `lang="fr"` subtítols; `lang="es"` UI alumna i traduccions; `lang="fr"` `/teacher`.
- [ ] Focus visible; cap `tabindex` > 0.
- [ ] Icones decoratives `aria-hidden`.
- [ ] Res de % ni «x de y» a `/class`, `/home`, `/progress`.
- [ ] Verificat amb `playwright-cli` a 768×1024 i 390×844.

## 9. Textos fixos de la UI

| Lloc | Text |
|---|---|
| botó clip (classe, FR) | Je n'ai pas compris |
| botó perdut (classe, FR) | J'ai perdu le fil |
| confirmació botó (toast, FR) | Extrait enregistré / Moment enregistré |
| interruptor subtítols | Sous-titres |
| fi de classe | Terminer le cours / Cours terminé |
| sr-only taronja | ya la marcaste antes |
| títol casa | Review (Clips to review · Practice · To understand better) |
| títol progrés | Progress |
| profe: moments | Difficult moments |
| profe: paraules | Most marked words |
| profe: autonomia | Autonomy · Concepts to review · Key points |
| marca | Loop'd |

## 10. Do / Don't (visual)

**Do:** crema com a canvas; pastilles a CTAs; tracking negatiu a headings ≥ 40 px; sunbeam amb mesura; ombra sticker només a botons foscos; un sol blau d'acció per vista; ritme 64 px entre seccions; punt taronja de marca sempre present.

**Don't:** `#000` al cos; ombres fortes a targetes; radis 0–4 px; colors nous fora de paleta; centrar paràgrafs llargs; icones monoline outline; letter-spacing 0/positiu a headings; tema fosc.
