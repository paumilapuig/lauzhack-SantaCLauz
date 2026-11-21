# Spec: ui-base — tokens, font, Word, BigButton, Card, /ui demo

## Goal
Ship the DESIGN.md §2–5 look as reusable pieces (`Word`, `BigButton`, restyled `Card`, tokens, Atkinson font) shown on a public `/ui` page.
Acceptance: `/ui` at 768x1024 and 390x844 shows "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone." with "déchets" dashed-yellow + "desechos" below, "dioxyde de carbone" unmarked, "chaleur" double-orange + History icon + "calor"; tapping "dioxyde de carbone" reveals its translation; both big buttons show "Guardado" for 2 s after a press; one bordered, shadowless Card.

## Contract changes
None (`docs/API.md` untouched).

## Tasks

**T0 / Component test setup**
- Files: `web/package.json`, `web/package-lock.json`, `docs/PLAN.md`
- Do: `npm i -D jsdom @testing-library/react`. Add one line to PLAN.md Decisions log: "web: jsdom + @testing-library/react (devDeps) for component tests; opt in per file with `// @vitest-environment jsdom`."
- Skip `@testing-library/user-event`: `fireEvent` is enough and plays well with `vi.useFakeTimers`.
- Test first: none (tooling). Check: `npm run test` still green.
- Depends on: none. Size: ~5 lines + lockfile.

**T1 / Tokens, font, Card**
- Files: `web/app/globals.css`, `web/app/layout.tsx`, `web/components/ui/card.tsx`
- Do: set `:root` shadcn vars to DESIGN.md §2 hex values; add `--lost`, `--word-yellow`, `--word-yellow-bg`, `--word-orange` and register as `--color-lost`, `--color-word-yellow`, `--color-word-yellow-bg`, `--color-word-orange` in `@theme inline`; `--radius: 12px`; delete the `.dark` block. layout.tsx: replace Geist sans with `Atkinson_Hyperlegible` (`weight: ["400","700"]`, `variable: "--font-atkinson"`, subsets latin); in `@theme inline` set `--font-sans: var(--font-atkinson), system-ui, sans-serif` (fixes the circular ref). card.tsx: replace `ring-1 ring-foreground/10` with `border border-border`, radius 16px (`rounded-2xl` if `rounded-xl` maps to <16px under the new `--radius`), no shadow.
- Test first: playwright-cli check, done in T4 (no visual surface before /ui). `npm run build` + `npm run lint` must pass.
- Depends on: none. Size: ~60 lines.

**T2 / Word**
- Files: `web/components/ui/word.tsx`, `web/components/ui/word.test.tsx`
- API: `export function Word({ text, translation, state, onTap }: { text: string; translation: string; state: "green" | "yellow" | "orange"; onTap: () => void })`. Export `type WordState`.
- Do: per DESIGN.md §4 rules (inline-flex column, min 44x44, `data-state`, `lang="fr"`, translation span `lang="es"` with `useId` id referenced by `aria-describedby`, only when shown). Orange: lucide `History` `aria-hidden` + `<span className="sr-only">ya la tocaste antes</span>`. On tap: call `onTap`, set `data-tapped` (bg `--word-yellow-bg`) for 600 ms; if green, reveal translation (stays revealed).
- Test first (`// @vitest-environment jsdom`, `afterEach(cleanup)`), asserts: button has `lang="fr"` and `data-state`; yellow shows "desechos" with `lang="es"` and the button's `aria-describedby` equals its id; green shows no translation and no `aria-describedby` until clicked, then shows it; orange has the sr-only text and an `aria-hidden` svg; click calls `onTap` once; `data-tapped` gone after `vi.advanceTimersByTime(600)`.
- Depends on: T0. Size: ~120 lines.

**T3 / BigButton**
- Files: `web/components/ui/big-button.tsx`, `web/components/ui/big-button.test.tsx`
- API: `export function BigButton({ variant, onPress }: { variant: "unclear" | "lost"; onPress: () => void })`.
- Do: reuse `Button` from `button.tsx` (do not edit it) with className: h-[72px], `w-full`, 22px/700 (20px mobile), icon 24px left. `unclear`: `bg-primary`, `Rewind`, "No he entendido". `lost`: `bg-lost text-white`, `CircleHelp`, "Me he perdido". After press: label "Guardado" + `Check`, `disabled` for 2000 ms, then back. Clear timer on unmount. No stacking layout (page owns it).
- Test first (`// @vitest-environment jsdom`, fake timers), asserts: each variant renders its label; click calls `onPress` once and shows "Guardado" + disabled; second click during 2 s does not call again; after `advanceTimersByTime(2000)` label is back and button enabled.
- Depends on: T0. Size: ~100 lines.

**T4 / Demo page /ui**
- Files: `web/app/ui/page.tsx`
- Do: `"use client"` page. Card containing the sentence as plain text + `Word`s (déchets yellow "desechos", "dioxyde de carbone" green "dióxido de carbono", plus a second line with "chaleur" orange "calor"); below, both `BigButton`s in a flex container stacked under 480px, gap 16px. Handlers are no-ops (`console.info` not allowed; use `() => {}`).
- Test first: playwright-cli at 768x1024 and 390x844: screenshot; assert three words visible with correct marks, click "dioxyde de carbone" shows "dióxido de carbono", click each BigButton shows "Guardado", font-family computed contains "Atkinson". Stop the dev server after.
- Depends on: T1, T2, T3. Size: ~60 lines.

## Parallel plan
- Wave 1: T0, T1 (no shared files)
- Wave 2: T2, T3 (no shared files)
- Wave 3: T4
