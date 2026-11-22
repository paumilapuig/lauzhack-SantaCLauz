# Spec: teacher-pages — /teacher (lessons + create) and /teacher/lessons/[id] (dashboard)

## Goal
The teacher creates a lesson from pasted text or a file and sees, per lesson, where students got lost, which words they marked, which notions to revisit and each student's autonomy, in French.
Acceptance (demo, logged in as `prof-demo`): `/teacher` lists "La respiration cellulaire"; pasting a text + "Créer la leçon" shows "Préparation du glossaire…" then lands on the new lesson's dashboard; the seeded lesson's dashboard shows, in order, "À retenir" (e.g. "Lucía (semaine 4) : autonomie 53 % → 80 % en 4 semaines."), one "Autonomie" card per student ("80 %" + rising line), "Pour la prochaine classe" (Moments difficiles bars, highest in bold + Notions à revoir "min 12", "à revoir"), "Mots les plus marqués". As `lucia-w1`, `/teacher` redirects to `/home`; logged out, to `/login`.

## Non-goals
Editing/deleting lessons, showing the created terms, charts library, realtime refresh, mobile-first layout tuning, Playwright test suite (UI checks are manual `playwright-cli`).

## Contract changes
None. Uses `GET /api/lessons`, `POST /api/lessons`, `GET /api/teacher/lessons/{id}/dashboard` exactly as in `docs/API.md` (L72-73, L89-92, L188-205). Types in `web/app/teacher/teacher-contract.ts` mirror them.

## Files (all new unless noted; owner A)
| File | Responsibility |
|---|---|
| `web/app/teacher/teacher-contract.ts` | Types: LessonSummary, LessonTerm, NewLessonFields, CreateLessonResponse, LostPeak, ConceptGapStatus, ConceptGapRow, TopWord, WeeklyAutonomy, StudentAutonomy, TeacherDashboard |
| `web/app/teacher/teacherApi.ts` | `createTeacherApi(baseUrl, getToken, fetchImpl = fetch)` → `listLessons`, `createLessonFromText`, `createLessonFromFile`, `getDashboard` |
| `web/app/teacher/teacher-api-client.ts` | Singleton `teacherApi` (NEXT_PUBLIC_API_URL ?? "http://localhost:8000", token from `@/lib/supabase/client` getSession). Glue, no test |
| `web/app/teacher/teacher-errors.ts` | `createLessonErrorFr(status)`, `loadErrorFr(status)` |
| `web/app/teacher/lesson-file.ts` | `MAX_LESSON_FILE_BYTES`, `validateLessonFile({name,size,type})` |
| `web/app/teacher/lessons/[id]/dashboard-format.ts` | Pure formatting for the dashboard cards |
| `web/app/teacher/lessons/[id]/insights.ts` | `insights(dashboard): string[]`, the "À retenir" sentences |
| `web/app/teacher/create-lesson-form.tsx` | Client form (text or file), loading, errors, redirect |
| `web/app/teacher/lesson-list.tsx` | Client list of lessons with links |
| `web/app/teacher/page.tsx` | Server page: h1 "Mes leçons", form + list |
| `web/app/teacher/lessons/[id]/lost-peaks-section.tsx`, `concept-gaps-section.tsx` | Card-less sections (h3 + content) |
| `web/app/teacher/lessons/[id]/next-class-card.tsx` | Card "Pour la prochaine classe" composing both sections |
| `web/app/teacher/lessons/[id]/top-words-card.tsx`, `autonomy-card.tsx`, `insights-card.tsx` | One card each |
| `web/app/teacher/lessons/[id]/dashboard-view.tsx` | Client: fetch dashboard, states, grid of cards |
| `web/app/teacher/lessons/[id]/page.tsx` | Server page: `const { id } = await params` (Next 16 Promise) → `<DashboardView lessonId={id}/>` |
| `web/app/teacher/layout.tsx`, `web/app/teacher/teacher-shell.tsx` | Role gate + `lang="fr"` shell |
| `web/lib/supabase/proxy-session.ts` (edit, 1 line) | Add `"/teacher"` to PROTECTED_PREFIXES |

Rules: don't edit `web/lib/api.ts`, `web/lib/api-client.ts`, `web/app/class/*`, `web/components/*`, `DESIGN.md`. Reuse `ApiError` from `@/lib/api`, `Button`/`Card`/`Input`/`Label` from `@/components/ui`. No textarea/select component: plain elements styled with tokens (`border-border rounded-xl`, text ≥ 14px). One blue primary CTA per view ("Créer la leçon"). No new libraries.

## Tasks
**T1 / Contract types + API client** — Files: `teacher-contract.ts`, `teacherApi.ts`, `teacherApi.test.ts`, `teacher-api-client.ts` (all in `web/app/teacher/`)
- Every request: `Authorization: Bearer <token>` when token. JSON calls set `Content-Type: application/json`. `createLessonFromFile(fields, file)` sends `FormData` (title, subject, lesson_date, file) and sets NO Content-Type (copy the pattern of `web/app/class/classApi.ts`, don't import it). Non-ok → `ApiError(status, …)`; fetch rejection → `ApiError(0, "network")`.
- Test first (inject `fetchImpl = vi.fn()`): listLessons hits `${base}/api/lessons` with "Bearer tok"; createLessonFromText POSTs the exact JSON body with JSON content type; createLessonFromFile body is `FormData` with the 4 fields and no Content-Type header; getDashboard("abc") hits `/api/teacher/lessons/abc/dashboard`; 502 → rejects ApiError status 502; rejection → status 0. Depends: none. Size: ~140.

**T2 / French errors + file validation** — Files: `web/app/teacher/teacher-errors.ts`, `teacher-errors.test.ts`, `lesson-file.ts`, `lesson-file.test.ts`
- `createLessonErrorFr`: 401 "Session expirée, reconnectez-vous." · 403 "Réservé aux enseignants." · 413 "Fichier trop lourd (10 Mo maximum)." · 415 "Format non accepté : txt, PDF, PNG ou JPG." · 422 "Il manque un champ, ou le texte/fichier est vide ou illisible." · 502 "L'IA n'a pas pu préparer le glossaire. Réessayez." · 503 "L'IA n'est pas configurée sur le serveur." · 500 "Impossible d'enregistrer la leçon. Réessayez." · 0 "Serveur injoignable." · other "Erreur inattendue (code N)."
- `loadErrorFr`: 401 same · 403 "Cette leçon n'est pas la vôtre." · 404 "Leçon introuvable" · 0 same · other same.
- `validateLessonFile`: `MAX_LESSON_FILE_BYTES = 10 * 1024 * 1024`; accepted if extension .txt/.pdf/.png/.jpg/.jpeg OR mime text/plain, application/pdf, image/png, image/jpeg (same rule as `api/app/glossary/upload.py`); size 0 → "Le fichier est vide."; > max → 413 message; unsupported → 415 message; else `null`.
- Test first: each status listed → its string; 418 → "Erreur inattendue (code 418)."; `a.pdf` 10 MB exact → null, +1 byte → 413 text; `a.docx` → 415 text; `photo` with `image/jpeg` → null; size 0 → empty text. Depends: none. Size: ~90.

**T3 / Dashboard formatting + insights** — Files: `web/app/teacher/lessons/[id]/dashboard-format.ts`, `dashboard-format.test.ts`, `insights.ts`, `insights.test.ts`
- `peakBars(peaks)` → sorted by minute asc, each `{minute, count, widthPct: count/max*100, isMax: count === max}` ([] → []). `statusLabelFr`: pending "à faire", review "à revoir", understood "compris". `formatMinutes([3,12])` → "min 3, 12" ([] → "—"). `formatAutonomy(0.534)` → "53 %" (Math.round), null → null. `sparklinePoints(weekly, width, height)` → "x,y …" with x = i·width/(n−1), y = height − autonomy·height (fixed 0–1 scale); fewer than 2 points → "".
- Test first: API.md peaks [{12,5},{3,2}] → minutes [3,12], 12 isMax, widthPct 40/100; labels; "min 3, 12"; "80 %"; `sparklinePoints([{0.5},{1}],100,20)` === "0,10 100,0"; one point → "".
- `insights(dashboard: TeacherDashboard): string[]`, at most 3, in this order (cap: students first, then peak, then word): (a) per student with weekly.length ≥ 2: "{name} : autonomie {first} % → {last} % en {n} semaines." (first/last = weekly[0]/weekly[n−1] × 100 rounded, n = weekly.length); (b) if a peak has count ≥ 2, take highest count (tie → earliest minute): "Minute {m} : {count} signalements « je me suis perdu »." and if a concept_gap's minutes contain m, insert " — probablement « {concept} »" before the final period; never the word "élèves"; (c) if top_words[0].taps ≥ 3: "« {lemma} » a été marqué {taps} fois." No data → [].
- Test first (insights): API.md dashboard → exact 3 sentences; 4 students with 2+ weeks → 3 student sentences only (cap); peaks [{3,4},{12,4}] → minute 3 (tie); gap with minutes [12] → "… « je me suis perdu » — probablement « Comment la cellule fabrique de l'énergie »."; peak count 1 and taps 2 → no sentence; student with 1 week → none; empty arrays → []; no sentence contains "élèves". Depends: T1 (types). Size: ~150.

**T4 / Create-lesson form** — Files: `web/app/teacher/create-lesson-form.tsx`
- Fields Titre, Matière, Date (`type="date"`, default today), all `required`. Two radio options "Coller le texte" (textarea, required) / "Envoyer un fichier" (`accept=".txt,.pdf,.png,.jpg,.jpeg"`, validated on change with `validateLessonFile`, error shown, submit blocked). Submit "Créer la leçon": disabled while pending, `aria-live="polite"` text "Préparation du glossaire… (quelques secondes)". Error: `role="alert"` with `createLessonErrorFr(err.status)`. Success: `router.push(\`/teacher/lessons/${lesson_id}\`)` (simplest; terms not shown).
- Check (playwright-cli, as prof-demo): choose a 12 MB file → 413 text, no request; paste text → loading text → dashboard URL. Depends: T1, T2. Size: ~140.

**T5 / Next-class card + top words** — Files: `lessons/[id]/lost-peaks-section.tsx`, `concept-gaps-section.tsx`, `next-class-card.tsx`, `top-words-card.tsx`
- `NextClassCard({lostPeaks, conceptGaps})`: one Card titled "Pour la prochaine classe" rendering `LostPeaksSection` (h3 "Moments difficiles") then `ConceptGapsSection` (h3 "Notions à revoir"); sections have no Card of their own. `TopWordsCard` titled "Mots les plus marqués". Peaks: one row per `peakBars` item, label "min N", bar `bg-lost` with `style={{width}}`, count; `isMax` row `font-bold`. Top words: `lang="fr"` lemma + "N fois", order as received. Gaps: rows student · concept · `formatMinutes` · `statusLabelFr` chip. Empty states: "Personne ne s'est perdu pendant cette leçon.", "Aucun mot marqué pour l'instant.", "Aucune notion à revoir."
- Check: covered by T8 screenshot. Depends: T1, T3. Size: ~120.

**T6 / Autonomy + insights cards** — Files: `lessons/[id]/autonomy-card.tsx`, `lessons/[id]/insights-card.tsx`
- `InsightsCard({sentences})`: Card "À retenir", one `<li>` per sentence; returns `null` when empty.
- Title "Autonomie", student name, big `formatAutonomy` figure (text-4xl); null → "pas encore de séance terminée". Inline `<svg viewBox>` `<polyline points={sparklinePoints(...)}>` stroke `currentColor` `text-primary`, `role="img"`, `aria-label="Évolution : 53 % → 80 %"` (first → last); hidden when points "". Weeks "W44 → W47" in muted text.
- Check: covered by T8 screenshot. Depends: T1, T3. Size: ~80.

**T7 / /teacher page + list** — Files: `web/app/teacher/page.tsx`, `web/app/teacher/lesson-list.tsx`
- List (client, pattern of `web/app/home/home-review.tsx`): "Chargement…", `role="alert"` `loadErrorFr`, empty "Aucune leçon pour l'instant.", rows title + subject + date (`toLocaleDateString("fr-CH")`) linking to `/teacher/lessons/{id}`. Page: h1 "Mes leçons", section "Nouvelle leçon" (`<CreateLessonForm/>`) + section "Leçons" (`<LessonList/>`), `lg:grid-cols-2`.
- Check: playwright-cli 1280x800 as prof-demo: seeded lesson listed and clickable; screenshot. Depends: T4. Size: ~90.

**T8 / Dashboard page** — Files: `lessons/[id]/dashboard-view.tsx`, `lessons/[id]/page.tsx`
- View: "Chargement…"; error → `role="alert"` `loadErrorFr` (403 / 404 texts) + link "Retour aux leçons"; data → h1 lesson title, then in order: (1) `InsightsCard` with `insights(data)` (hidden when empty); (2) AutonomyCards in `grid gap-6 lg:grid-cols-2` (empty students → "Aucun élève n'a encore suivi cette leçon."); (3) `NextClassCard` full width; (4) `TopWordsCard`.
- Check: playwright-cli 1280x800 + 800x1000 on seeded lesson (2 cols / 1 col), random uuid → "Leçon introuvable"; screenshots. Depends: T3, T5, T6. Size: ~80.

**T9 / Access gate + shell + proxy** — Files: `web/app/teacher/layout.tsx`, `web/app/teacher/teacher-shell.tsx`, `web/lib/supabase/proxy-session.ts`, `docs/STATUS.md`
- Proxy: `PROTECTED_PREFIXES = ["/dashboard", "/teacher"]` (only change). Layout (server, async): `createClient()` from `@/lib/supabase/server`; `getUser()`; no user → `redirect("/login")`; `profiles.select("role").eq("id", user.id).single()`; role ≠ "teacher" → `redirect("/home")`; else `<TeacherShell>`. Shell: `<div lang="fr">`, header "Espace enseignant" + link "Mes leçons" (/teacher) + `<form action="/auth/signout" method="post">` button "Se déconnecter" (route is POST-only), cream bg, max-w container. STATUS line: shared-file edit of proxy-session.ts.
- Check: playwright-cli logged out → /login; lucia-w1 → /home; prof-demo → shell with `lang="fr"`. Depends: none. Size: ~60.

## Parallel plan
- **Wave 1** (no deps): T1 contract + API client · T2 errors + file validation · T9 gate + shell + proxy + STATUS
- **Wave 2**: T3 formatting + insights (T1) · T4 create form (T1, T2)
- **Wave 3**: T5 next-class + top words (T1, T3) · T6 autonomy + insights cards (T1, T3) · T7 /teacher page + list (T4)
- **Wave 4**: T8 dashboard page (T3, T5, T6)
File sets are disjoint within every wave. After wave 4: `npm run lint`, `npx vitest run`, `npm run build`, then reviewer.
