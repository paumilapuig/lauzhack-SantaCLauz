# Spec — /home and /progress through Apple's HIG (apple-design-skill review)

Owner: Pau (D). Source: review with github.com/dickwu/apple-design-skill (HIG pages: segmented-controls, tab-bars, color, typography, layout, lists-and-tables, buttons). Web app on tablet/phone: foundations + iPadOS/iOS conventions translated to the web.

## Goal
Same features, rebuilt to the HIG: tab bar navigation, light + dark appearance, the system type scale, Settings-style lists, exercises in a modal sheet, undo for removing a word. Look stays clean (no decorative boxes); the karaoke transcript + waveform stays the signature.

## Tokens (only inside the student pages: wrapper class `student` set by `StudentPage`)
Add to `web/app/globals.css` (light values already exist on :root for label/fill/separator; add the dark block):
```css
@media (prefers-color-scheme: dark) {
  .student {
    --background: #000000; --card: #1C1C1E; --foreground: #F5F5F7;
    --label: #F5F5F7; --label-secondary: #98989D; --muted-foreground: #98989D;
    --fill: #1C1C1E; --fill-strong: #2C2C2E; --separator: rgb(255 255 255 / 0.15); --border: rgb(255 255 255 / 0.15);
    --primary: #5EC4CF; --primary-foreground: #00191C; --ring: #5EC4CF; --accent: #10343A;
    --word-yellow: #F2C14E; --word-yellow-bg: #3A2E0A; --word-orange: #FF8A5B; --marker-strong: #F2B33D;
    color-scheme: dark;
  }
}
```
Contrast (dark): label 18.9:1, label-secondary 7.3:1, primary text 10.4:1 on black, primary-foreground on primary 10.2:1, word-yellow 12.6:1. Light values unchanged (label-secondary #6E6E73 4.8:1 on white).
Never hard-code `bg-white`/`text-white`/`#fff` in student pages: use `bg-background`, `bg-card`, `text-primary-foreground`, etc.

## Type scale (HIG iOS "Large" default, px = pt)
| Role | Class |
|---|---|
| Large Title (page) | `text-[34px] leading-[41px] font-bold tracking-[-0.02em]` |
| Title 2 (section) | `text-[22px] leading-[28px] font-bold` |
| Title 3 (exercise word / hero) | `text-[20px] leading-[25px] font-semibold` |
| Headline (row title) | `text-[17px] leading-[22px] font-semibold` |
| Body | `text-[17px] leading-[22px]` |
| Subhead | `text-[15px] leading-[20px]` |
| Footnote (meta) | `text-[13px] leading-[18px]` |
| Reading text (transcript, judgment) | `text-[20px] leading-[2]` |
Nothing under 13px except tab labels (12px, HIG min 11).

## Tasks (parallel, no shared files)

### A — Shell, tab bar, dark mode, progress
Files: `web/app/globals.css`, `web/components/student-page.tsx`, `web/components/student-nav.tsx`, `web/components/today-label.tsx` (delete), `web/components/progress-hero.tsx`, `web/components/progress-message.tsx`, `web/app/progress/page.tsx`, plus a test `web/components/student-nav.test.tsx`.
- `StudentPage`: wrapper `student bg-background text-label min-h-dvh`; no date; Large Title + Subhead lead (`text-label-secondary`); content `max-w-[1180px] px-5 md:px-8`, `pt-6 md:pt-10`; bottom padding `pb-28 md:pb-16` (room for the phone tab bar).
- `StudentNav` = tab bar, 2 tabs, single-word labels **Repasar** / **Progreso**, lucide icons (BookOpen, Sprout), `aria-current="page"` on the active one, links (not buttons):
  - `< md`: fixed bottom bar, full width, `bg-background/85 backdrop-blur-xl` (blur only on this floating layer), top hairline `border-t border-separator`, height 56px + `padding-bottom: env(safe-area-inset-bottom)`; each tab a column (icon 24px over 12px label), equal width, ≥44px tall; active = `text-primary`, inactive = `text-label-secondary`.
  - `≥ md`: centered at the top of the page (`sticky top-3 z-10`), capsule `rounded-full bg-fill/90 backdrop-blur-xl p-1`, tabs icon + label side by side, `h-10 px-5 text-[15px] font-semibold`, active = `bg-background text-label shadow-sm`, inactive = `text-label-secondary`.
  - Test: renders two links with the right hrefs, the active one has aria-current.
- Progress: hero = Footnote eyebrow "Esta semana" (`text-primary font-semibold`), figure `text-[96px] md:text-[120px] font-bold tracking-[-0.04em] tabular-nums`, sentence Title 2. Other messages = Settings-style rows (29px icon tile `rounded-[7px] bg-primary` with `text-primary-foreground` icon size-[18px], Body text), `divide-y divide-separator`. Keep `progress-message.test.tsx` passing (h2 text, icon class, aria-hidden).

### B — Home lists and clip
Files: `web/app/home/my-words-list.tsx` (+test), `web/app/home/practice-modes-list.tsx` (+test), `web/app/home/clip-card.tsx`, `web/app/home/clip-transcript.tsx`, `web/app/home/waveform.tsx`, `web/app/home/cards.test.tsx`.
- Tus palabras rows (min-h-11, py-2.5): Headline word + Body translation in `text-word-yellow`; trailing icon button (lucide `X` in a 28px circle `bg-fill text-label-secondary`, hit area 44px) with `aria-label="Quitar <word>"`. **Undo**: pressing it turns the row into "Quitada" (Subhead, label-secondary) + a "Deshacer" text button (`text-primary`); `onRemove` is called only after 5 s (clear the timer on unmount / undo). Tests: undo keeps the word and never calls onRemove; after 5 s (fake timers) onRemove is called once.
- Practicar = Settings list: each mode a full-width `<button>` row min-h-11 py-2, 29px icon tile `rounded-[7px] bg-primary text-primary-foreground` (icon size-[18px]), Body name, trailing lucide `ChevronRight` size-4 `text-label-secondary`; `divide-y divide-separator`; disabled rows `aria-disabled`, opacity-40, reason as Footnote under the name. Keep its tests' intent.
- Clip: meta Footnote; transcript reading size `text-[20px] leading-[2]`; play button 44px (`size-11`, `bg-primary text-primary-foreground`); waveform `h-10`; times Footnote tabular-nums. Nothing else changes (karaoke, tap-to-save).

### C — Modes in a sheet, home layout
Files: `web/app/home/home-review.tsx`, `web/app/home/home-review.test.tsx`, `web/app/home/exercises/exercise-shell.tsx`, `web/app/home/exercises/exercise-shell.test.tsx`, any `web/app/home/exercises/*.tsx` that hard-codes white.
- Section headings Title 2 with the count in Body `text-label-secondary`; `pb-2 border-b border-separator`; two columns `lg:grid-cols-[minmax(0,1fr)_360px] gap-12` as now.
- An open mode renders inside the existing `Dialog` (`web/components/ui/dialog.tsx`, base-ui) instead of replacing the page: `< md` full-screen sheet; `≥ md` centered sheet `max-w-[720px] rounded-2xl`, max-h 90dvh scrollable, backdrop dim. Title = the mode name as the dialog title (Title 3), trailing "Cerrar" text button (`text-primary`, 44px); Escape and backdrop click close it (no save on close). The page (with its h1) stays underneath. `ExerciseShell` must not render its own `<h1>` inside the dialog: give it the title via the dialog's title element.
- Exercise answer buttons: keep `bg-fill`/`hover:bg-fill-strong`; primary actions (Comprobar, Siguiente, Volver) = prominent style `bg-primary text-primary-foreground h-11 rounded-full px-6 font-semibold` (buttons.md: accent on the background of the primary action only).
- Tests: opening Tarjetas shows a dialog (role="dialog") titled "Tarjetas" while the page heading "Para repasar" is still in the document; Cerrar closes it without calling savePractice.

## Out of scope
/class, /teacher, the API, fake data.
