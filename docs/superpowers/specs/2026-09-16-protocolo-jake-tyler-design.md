# Protocolo Jake Tyler — Design Spec

Date: 2026-09-16
Status: Approved, pending implementation plan

## Summary

A personal, single-user web app for tracking an 8-week body recomposition
program: daily strength training (5 rotating blocks), a diet plan (6 meals/day
with alternative options), daily supplementation, and a complementary-activity
schedule (some days fixed, some user-chosen). Deployed on Vercel, backed by
Vercel Postgres (Neon), with a settings screen that lets the user replace all
plan content (workouts/meals/supplements/program/week-pattern) by pasting
JSON — no code changes needed to update the plan.

No authentication. The app is reachable by anyone with the URL (acceptable —
personal use, no sensitive health data beyond workout/diet checklists).

## Stack

- Next.js (App Router, TypeScript), deployed on Vercel.
- Vercel Postgres (Neon-backed). No ORM — `@vercel/postgres` tagged-template
  client + a thin `lib/db.ts` with typed helper functions. A single
  `schema.sql` creates both tables; no migration tooling needed at this scale.
- Tailwind CSS for styling. No component library — small custom components
  (Card, Chip, ProgressBar, Checkbox) to keep the "clean, serious, not
  infantilized" aesthetic fully controlled.
- Vitest for unit tests of the pure business-logic functions.
- Git repo pushed to `https://github.com/Claytonjosev-hub/projetojaketyler.git`
  (empty repo, confirmed via `git ls-remote`). Vercel project connected to
  this GitHub repo for continuous deployment on push to `main`.

## Data model

### `content` table (plan/config data — replaces "hard-coded" seed data)

One row per content type. Each row's `data` column is a JSON document whose
shape matches exactly what the user pastes/exports in Settings.

| column | type | notes |
|---|---|---|
| `key` | text, PK | one of: `program`, `weekPattern`, `workoutPlan`, `meals`, `supplements` |
| `data` | jsonb | shape depends on `key`, see below |
| `updated_at` | timestamptz | set on every write |

Shapes:

- `program`: `{ startDate: "YYYY-MM-DD", durationWeeks: number }`
- `weekPattern`: array of 7 entries (Monday=0 .. Sunday=6), each
  `{ dayOfWeek: 0-6, trainingBlock: "A"|"B"|"C"|"D"|"E"|null, activity: string|null, activityEditable: boolean, activityOptions: string[] }`
- `workoutPlan`: `{ [blockLetter: string]: { focus: string, exercises: Exercise[] } }`
  where `Exercise = { name: string, reps: string, tempo: string, sets: number[8] }`
  (`sets[i]` = sets prescribed in program week `i+1`).
- `meals`: array of
  `{ id: string, time: "HH:MM", name: string, options: { title: string, items: string }[] }`
- `supplements`: array of `{ id: string, name: string, dose: string }`

### `daily_logs` table (actual tracking data, one row per date interacted with)

| column | type | notes |
|---|---|---|
| `date` | date, PK | `YYYY-MM-DD` |
| `training_done` | boolean | default false |
| `exercises_done` | jsonb | map `{ [exerciseIndex: string]: boolean }`, scoped to that date's training block |
| `activity_choice` | text, nullable | overrides the week pattern's default activity for this date when set |
| `meals` | jsonb | map `{ [mealId: string]: { chosenOptionIndex: number, done: boolean } }` |
| `supplements` | jsonb | map `{ [supplementId: string]: boolean }` |
| `updated_at` | timestamptz | set on every write |

A date with no row is treated as "nothing logged" — correct for both future
dates and past dates the user simply hasn't touched. Rows are upserted on
first interaction with a date. Max 56 rows for the whole 8-week program, so
no pagination or indexing concerns for the heatmap/stats queries.

## Business rules (pure functions in `lib/program.ts`, unit-tested)

- `getProgramDay(date, startDate)`: day offset from `startDate`, 1-indexed.
- `getWeekNumber(programDay)`: `ceil(programDay / 7)`, clamped to `[1, 8]`.
- `getDayPattern(date, weekPattern, dailyLog)`: looks up the weekday's default
  pattern, then overlays `dailyLog.activity_choice` if present for that date.
- `isDayComplete(date, dailyLog, pattern, mealsContent, supplementsContent)`:
  `true` only if ALL of:
  - every meal in `mealsContent` has `meals[mealId].done === true`
  - every supplement in `supplementsContent` has `supplements[id] === true`
  - if the day has a training block OR a resolved activity that isn't
    "Nenhuma"/"Descanso": `training_done === true`
  - Future dates (relative to "today") are always excluded from completion
    counts, never counted as complete or incomplete.

These four functions are the crux of the app's correctness (week clamping,
"today" boundary, the day-complete AND-rule) — they get direct unit tests
covering week 1/8 boundaries, a rest day, an editable-activity day with
"Nenhuma" selected, and a future date.

## Routes / pages

- `/` — **Hoje** tab. Greeting with today's date; two summary cards (meals
  done today X/6, trainings done this program-week X/5) each with a progress
  bar; 7-day week view (cards Mon–Sun of the current program week) that
  expand on tap to show exercises (with per-exercise checkboxes, auto-checking
  "treino concluído" when all exercises are done) or the activity chip
  selector for editable days; supplements checklist; 6 meals list with
  expandable option-picker (radio) and a "mark done" button per meal.
- `/progress` — **Progresso** tab. GitHub-style heatmap (one column per
  program week, 7 cells Mon–Sun, colored complete/incomplete/future);
  completed-days-over-elapsed-days stat; current streak; current-month
  completion summary with progress bar.
- `/settings` — Five paste-JSON panels (program, weekPattern, workoutPlan,
  meals, supplements), each with: a textarea pre-filled with the current
  content (so "export" is just what's already shown), a "Salvar" button that
  validates shape before writing (clear inline error on malformed/invalid
  JSON, nothing written on failure), and the save replaces that `content` row
  atomically.
- Bottom tab bar (Hoje / Progresso / Config) for one-handed iPhone use.

All mutations (checkbox toggles, activity choice, meal option selection,
settings saves) go through Next.js Server Actions — no separate REST/API
layer.

## PWA support

Web manifest + apple-touch-icon + `apple-mobile-web-app-capable` meta tags so
the app installs cleanly to the iOS home screen. No service worker / offline
cache — the whole point of moving off localStorage is that the database is
the real source of truth; an offline cache would risk showing stale data.

## Seed data

The exact program start date (2026-09-14), training blocks A–E with their
week-by-week set counts, the Monday–Sunday pattern, supplements list, and
meals list provided by the user are loaded via a one-time seed script that
writes directly into the `content` table's five rows. After first run, all
further edits happen through `/settings`, never by re-running the seed.

## Deployment plan

1. Scaffold Next.js app locally, build all routes/logic against a local
   Postgres connection (Vercel Postgres exposes a normal connection string —
   can develop against a Neon branch pulled via `vercel env pull` once the
   project is linked).
2. `git init`, initial commit, push to
   `https://github.com/Claytonjosev-hub/projetojaketyler.git` on `main`.
3. Link the repo as a Vercel project (`vercel link`), provision/attach
   Postgres storage, `vercel env pull` for local `.env.local`.
4. Run `schema.sql` against the provisioned database, run the seed script.
5. Deploy (push to `main` triggers Vercel's GitHub integration).

Two steps need the user live: `vercel login` (browser confirmation) and,
if the CLI can't provision Postgres non-interactively, creating the database
once in the Vercel dashboard.

## Out of scope (explicitly not building)

- Multi-user support / authentication.
- Offline support.
- Editing plan content as structured forms (JSON paste/export only, per
  explicit request).
- E2E/UI test automation.
