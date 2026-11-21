# Spec — /home and /progress, unslop pass (heydamir/unslop) on top of the HIG pass

Owner: Pau (D). Skill: `.claude/skills/unslop` (by Damir Sokolovsky @heydamir, CC BY 4.0). Keeps every feature, test intent, the HIG conventions (tab bar on phones, dark mode via `.student` tokens, Dialog sheet for modes) and Pau's rule: no decorative rounded boxes around sections.

## Direction
- Product: Lucía replays bits of her French class at home, marks the words she missed and practises them until help disappears.
- Character: calm, attentive, a little warm.
- World: listening again — the teacher's voice, the sound wave.
- Moment (one per screen): /home = the clip player drawn as the teacher's voice, a wide waveform with amber pins on the words she marked. /progress = the week's figure.
- Signature: the **amber mark** = "a word you marked". Same amber (`--marker-strong` on the wave, `text-word-yellow` for text) as dashed underline in the transcript, pin on the wave, 6px dot in the word list. Nowhere else.

## Tokens / rules (all passes)
- Spacing on a 4px grid only (no `py-2.5`, no `[13px]` margins). Rows in one list share one height.
- Color: neutral ramp from the existing `.student` tokens. **Accent (`--primary`) only on**: the active nav item's icon, the page's primary action inside a sheet, the progress figure eyebrow. Play buttons are ink (`bg-label text-background`), mode icons are `text-label-secondary`. No colored icon tiles.
- Type: system font (SF) + Inter fallback as now; **mono partner** = Geist Mono (already loaded in `web/app/layout.tsx` as `--font-geist-mono`; use `font-mono` class if Tailwind maps it, else `font-[family-name:var(--font-geist-mono)]`) for times, counts and meta numbers, with `tabular-nums`. Weights 400/500, 600 only for the page title. Sizes: page title 32 (40 from lg) weight 500 tracking -0.02em; section label 15/20 weight 500 `text-label-secondary`; body 17/24; secondary 15/20; meta mono 13/16. No uppercase tracked labels. No negative tracking under 16px.
- Title pattern (unslop "October 2026"): title = page name + context in secondary color on the same line, e.g. `Repasar` + ` · sábado 21` (date via the existing client-only pattern: compute after mount with useSyncExternalStore, empty on the server) and `Progreso` + ` · esta semana`.
- Icons: lucide, 18px, stroke 1.5, `text-label-secondary` (active nav: `text-primary`).
- Motion: one curve `cubic-bezier(0.22,1,0.36,1)`; hover/press 150ms; entrances 400ms, rise 8px. Transition only color/background/opacity/transform. No pulse/ping except the live mic.

## Layout
- **≥ lg (1024)**: app shell. Left **sidebar 256px** (`border-r border-separator`, full height, sticky): wordmark "Fondu" (17px, weight 600) at top (h-14 row), then nav rows (h-9, gap-1, icon + label, active row = `bg-fill` surface step + `font-medium`, `aria-current`), then a section labelled "Tus palabras" (label 13px secondary, 24px above / 8px below) holding the **compact word list** (rows h-9: amber 6px dot, word 15px, translation 15px `text-word-yellow` truncated, remove X on hover/focus, undo row kept). Main column: `max-w-[880px]` padding 32/40.
- **< lg**: no sidebar; HIG tab bar fixed at the bottom (current `StudentNav` phone styles); the word list renders in the main column after the clips (section "Tus palabras").
- Main /home order: title row → "Clips" (the moment) → "Practicar". /progress: title row → hero figure → message rows.

## Tasks (parallel, no shared files)

### A — Shell + composition
Files: `web/components/student-page.tsx`, `web/components/student-nav.tsx`, `web/components/student-nav.test.tsx`, `web/components/page-title.tsx` (new, title + secondary context, client date helper inside), `web/app/home/home-review.tsx`, `web/app/home/home-review.test.tsx`, `web/app/globals.css` (only if a token is missing).
- `StudentPage({ title, context?, sidebar?, children })`: renders the sidebar layout ≥ lg (nav + optional `sidebar` slot under it) and the bottom tab bar < lg. `StudentNav` gets a `variant: "sidebar" | "tabbar"` (or two exported components) — keep labels Repasar/Progreso, hrefs, aria-current, test updated.
- `home-review.tsx`: passes `<MyWordsList variant="compact" …/>` as `sidebar`; below lg shows `<MyWordsList …/>` in the main column (use `lg:hidden` / `hidden lg:block`, both share state). Sections: label style per tokens (no big h2 with border): `<h2 class="text-[15px] font-medium text-label-secondary">Clips <span class="font-mono tabular-nums">2</span></h2>` with 12px gap to content, 48px between sections. Mode sheet (Dialog) unchanged.
- Keep `home-review.test.tsx` intent (dialog title, page heading present, savePractice calls). The page h1 text becomes "Repasar".

### B — The moment: clip player
Files: `web/app/home/clip-card.tsx`, `web/app/home/clip-transcript.tsx`, `web/app/home/waveform.tsx`, `web/app/home/waveform.test.ts`, `web/app/home/cards.test.tsx`.
- Clip = no box. Meta row: mono 13 `text-label-secondary`: `22:10 · 0:00–0:30` with the lesson title in 15/500 `text-label` before it. Transcript 20/40 (leading-10) `max-w-[38em]`, karaoke unchanged; saved words: dashed amber underline + gloss (existing Word yellow).
- Player row: ink play button 44px (`bg-label text-background`, Pause when playing), waveform **h-16**, bars 2px wide with 2px gaps (compute bar count from the width: keep 64 if simpler but space them `justify-between`), unplayed `bg-fill-strong`, played `bg-label`, playhead 2px `bg-label`; **amber pins**: for every saved word that occurs in the transcript, a 2px amber line spanning the wave height at its position plus, under the wave, its word in mono 12 `text-word-yellow` (avoid overlap: skip a label closer than 64px to the previous one). Times under the wave in mono 13 tabular-nums. Waveform takes `marks: { at: number; label: string }[]` instead of a single mark; test it (positions/labels, overlap skip as a pure helper with a test).
- Keep the range input scrubber + aria labels; keep the Escuchar/Pausar names used by tests.

### C — Lists, modes, progress
Files: `web/app/home/my-words-list.tsx` (+test), `web/app/home/practice-modes-list.tsx` (+test), `web/app/home/practice-modes.ts` (descriptions back: one short line each, Spanish, no period), `web/components/progress-hero.tsx`, `web/components/progress-message.tsx` (+test), `web/app/progress/page.tsx`.
- `MyWordsList` gets `variant?: "full" | "compact"`: full = rows h-12, amber 6px dot, word 17/500, translation 17 `text-word-yellow`, X button (44px hit, icon 16 secondary) ; compact = rows h-9 as in the sidebar spec, X visible on row hover/focus-within (always visible on touch: `[@media(hover:none)]:opacity-100`). Undo row behaviour unchanged (5s, flush on unmount).
- Practicar: grid `sm:grid-cols-2` of plain rows (no tiles, no colored squares): line icon 18 `text-label-secondary`, name 17/500, description 15 `text-label-secondary`, `rounded-lg px-3 py-3 hover:bg-fill transition-colors`, disabled = `opacity-40` + reason as description. Keep its tests' intent.
- Progress: uses `StudentPage` title "Progreso" + context "esta semana". Hero = the moment: figure 120 (88 on phones) weight 500 tracking -0.03em tabular-nums, the full sentence 20/28 under it, eyebrow removed (context is in the title). Message rows: h-14, line icon 18 secondary, text 17. Keep progress-message.test intent (h2 text, svg class, aria-hidden).

## Out of scope
/class, /teacher, API, fake data, exercise components (they keep their current look inside the sheet).
