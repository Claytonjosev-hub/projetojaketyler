# Protocolo Jake Tyler — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Protocolo Jake Tyler app: a personal Next.js + Postgres tracker for an 8-week strength program (5 rotating blocks, real exercise/set data already extracted from the user's PDFs), a 6-meal diet with alternatives, 3 daily supplements, and a complementary-activity schedule (fixed cardio Mon–Fri, editable weekend sport), with a "Hoje" checklist view, a GitHub-style consistency heatmap, and a JSON-paste settings screen for editing all plan content without code changes.

**Architecture:** Next.js App Router (TypeScript) with three routes (`/`, `/progress`, `/settings`) behind a bottom tab bar. All mutations go through Server Actions. A `content` table holds the five plan documents as JSON; a `daily_logs` table holds per-date tracking state. Both are accessed through a thin `lib/db.ts` wrapper around `@vercel/postgres`. Pure business-logic functions (day/week resolution, completion rules) live in `lib/program.ts` and are the only part covered by automated tests, per the spec.

**Tech Stack:** Next.js 15+ (App Router, TypeScript), Tailwind CSS, `@vercel/postgres`, Vitest, deployed on Vercel with a Marketplace-provisioned Postgres (Neon) database.

**Spec:** `docs/superpowers/specs/2026-09-16-protocolo-jake-tyler-design.md`

## Global Constraints

- Next.js App Router + TypeScript, deployed on Vercel using the default Node.js runtime (Fluid Compute) — never `runtime = 'edge'`.
- Data access via the `@vercel/postgres` tagged-template `sql` client only — no ORM.
- Styling via Tailwind CSS only — no component library. Shared visual atoms live in `components/` (`Card`, `Chip`, `ProgressBar`, `Checkbox`).
- All mutations (checkbox toggles, activity choice, meal option pick, settings saves) go through Next.js Server Actions in `app/actions.ts` — no REST/API route layer.
- No authentication — the app is reachable to anyone with the URL. No sensitive data beyond workout/diet checklists.
- Settings edits are JSON paste/export only — never structured forms.
- Only `lib/program.ts` gets automated tests (Vitest). No E2E/UI test automation — UI tasks are verified by running the dev server and checking the browser.
- PWA support via Next.js's built-in `manifest.ts` / `icon.tsx` / `apple-icon.tsx` conventions — no service worker, no offline cache.
- Bottom tab bar routes: Hoje (`/`), Progresso (`/progress`), Config (`/settings`).
- Real plan content (workout, diet, supplements) is already extracted from the user's PDFs into `db/seed-data/*.json` (created before this plan). The seed task loads these files verbatim — no placeholder data anywhere in the seed path.

---

## File Structure

```
app/
  layout.tsx              — root layout, PWA meta tags, BottomTabBar
  globals.css             — Tailwind entrypoint
  manifest.ts             — PWA manifest route
  icon.tsx                — generated app icon (next/og ImageResponse)
  apple-icon.tsx          — generated iOS home-screen icon
  actions.ts              — all Server Actions
  page.tsx                — "Hoje" tab
  progress/page.tsx        — "Progresso" tab
  settings/page.tsx        — "Config" tab
components/
  Card.tsx
  Chip.tsx
  ProgressBar.tsx
  Checkbox.tsx
  BottomTabBar.tsx
  WeekView.tsx            — Mon–Sun cards for the current program week
  TrainingCard.tsx        — expandable exercise checklist for one day
  MealsList.tsx
  SupplementsList.tsx
  Heatmap.tsx
  SettingsPanel.tsx       — one JSON-paste editor, reused per content key
lib/
  types.ts                — shared TS types for all content/log shapes
  db.ts                   — @vercel/postgres wrapper (content + daily_logs)
  program.ts              — pure business-logic functions
  program.test.ts         — Vitest coverage for program.ts
db/
  schema.sql
  seed-data/
    program.json           (already created)
    week-pattern.json       (already created)
    workout-plan.json       (already created)
    meals.json              (already created)
    supplements.json        (already created)
scripts/
  seed.ts                 — one-time loader: seed-data/*.json → content table
vitest.config.ts
```

The five `db/seed-data/*.json` files already exist in the repo with the real
8-week training program (blocks A–E, per-exercise reps/tempo, per-week set
counts), the real 6-meal diet (with every option and substitution from the
nutritionist's PDF), and the real 3-supplement list. Task 3 wires them into
the database; no other task re-derives or re-types this content.

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `.gitignore`, `.env.local.example`

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` Next.js App Router project that later tasks add files to.

- [ ] **Step 1: Scaffold into a temp folder and merge into the repo**

The repo already has `docs/` and `db/` committed, so `create-next-app` must not
run against a non-empty directory. Scaffold into a throwaway subfolder and
move its contents up:

```bash
cd /Users/claytonjosev/code/projetojaketyler
npx --yes create-next-app@latest .next-scaffold \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias "@/*" --use-npm --no-git
shopt -s dotglob
mv .next-scaffold/* .
shopt -u dotglob
rmdir .next-scaffold
```

- [ ] **Step 2: Verify it boots**

Run: `npm run dev` (then Ctrl-C once it prints "Ready")
Expected: dev server starts on port 3000 with no errors.

- [ ] **Step 3: Replace the default landing page with a minimal placeholder**

`app/page.tsx`:

```tsx
export default function HojePage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold text-neutral-900">Hoje</h1>
    </main>
  );
}
```

- [ ] **Step 4: Add the env example file**

`.env.local.example`:

```
# Pulled automatically via `vercel env pull` once the project is linked to a
# Vercel Postgres (Neon, via the Marketplace) database. Never commit the real
# .env.local — it is already covered by the generated .gitignore.
POSTGRES_URL=
```

- [ ] **Step 5: Run the build to confirm the scaffold is sound**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app router project"
```

---

### Task 2: Database schema and client helpers

**Files:**
- Create: `db/schema.sql`, `lib/types.ts`, `lib/db.ts`
- Modify: `package.json` (add `@vercel/postgres`)

**Interfaces:**
- Consumes: nothing (first data-layer task).
- Produces: `getContent<K extends ContentKey>(key: K): Promise<ContentShape[K]>`, `setContent<K extends ContentKey>(key: K, data: ContentShape[K]): Promise<void>`, `getDailyLog(date: string): Promise<DailyLog | null>`, `upsertDailyLog(date: string, patch: Partial<Omit<DailyLog, "date">>): Promise<DailyLog>` — every later task reads/writes the database only through these four functions.

- [ ] **Step 1: Install the Postgres client**

```bash
npm install @vercel/postgres
```

- [ ] **Step 2: Write the schema**

`db/schema.sql`:

```sql
create table if not exists content (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists daily_logs (
  date date primary key,
  training_done boolean not null default false,
  exercises_done jsonb not null default '{}'::jsonb,
  activity_choice text,
  meals jsonb not null default '{}'::jsonb,
  supplements jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 3: Write the shared types**

`lib/types.ts`:

```ts
export type TrainingBlock = "A" | "B" | "C" | "D" | "E";

export interface Program {
  startDate: string; // "YYYY-MM-DD"
  durationWeeks: number;
}

export interface WeekPatternEntry {
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  trainingBlock: TrainingBlock | null;
  activity: string | null;
  activityEditable: boolean;
  activityOptions: string[];
}

export interface Exercise {
  name: string;
  reps: string;
  tempo: string;
  sets: number[]; // length 8, sets[i] = sets prescribed in program week i+1
}

export interface WorkoutBlockContent {
  focus: string;
  exercises: Exercise[];
}

export type WorkoutPlan = Record<TrainingBlock, WorkoutBlockContent>;

export interface MealOption {
  title: string;
  items: string;
}

export interface Meal {
  id: string;
  time: string; // "HH:MM"
  name: string;
  options: MealOption[];
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
}

export interface ContentShape {
  program: Program;
  weekPattern: WeekPatternEntry[];
  workoutPlan: WorkoutPlan;
  meals: Meal[];
  supplements: Supplement[];
}

export type ContentKey = keyof ContentShape;

export interface MealLogEntry {
  chosenOptionIndex: number;
  done: boolean;
}

export interface DailyLog {
  date: string;
  training_done: boolean;
  exercises_done: Record<string, boolean>;
  activity_choice: string | null;
  meals: Record<string, MealLogEntry>;
  supplements: Record<string, boolean>;
}
```

- [ ] **Step 4: Write the db wrapper**

`lib/db.ts`:

```ts
import { sql } from "@vercel/postgres";
import type { ContentKey, ContentShape, DailyLog } from "./types";

export async function getContent<K extends ContentKey>(
  key: K,
): Promise<ContentShape[K]> {
  const { rows } = await sql`select data from content where key = ${key}`;
  if (rows.length === 0) {
    throw new Error(`content key "${key}" has not been seeded yet`);
  }
  return rows[0].data as ContentShape[K];
}

export async function setContent<K extends ContentKey>(
  key: K,
  data: ContentShape[K],
): Promise<void> {
  await sql`
    insert into content (key, data, updated_at)
    values (${key}, ${JSON.stringify(data)}::jsonb, now())
    on conflict (key) do update set data = excluded.data, updated_at = now()
  `;
}

function rowToDailyLog(row: Record<string, unknown>): DailyLog {
  return {
    date: String(row.date).slice(0, 10),
    training_done: Boolean(row.training_done),
    exercises_done: (row.exercises_done ?? {}) as Record<string, boolean>,
    activity_choice: (row.activity_choice as string | null) ?? null,
    meals: (row.meals ?? {}) as DailyLog["meals"],
    supplements: (row.supplements ?? {}) as Record<string, boolean>,
  };
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const { rows } = await sql`select * from daily_logs where date = ${date}`;
  if (rows.length === 0) return null;
  return rowToDailyLog(rows[0]);
}

export async function upsertDailyLog(
  date: string,
  patch: Partial<Omit<DailyLog, "date">>,
): Promise<DailyLog> {
  const existing = (await getDailyLog(date)) ?? {
    date,
    training_done: false,
    exercises_done: {},
    activity_choice: null,
    meals: {},
    supplements: {},
  };
  const next: DailyLog = { ...existing, ...patch, date };
  await sql`
    insert into daily_logs
      (date, training_done, exercises_done, activity_choice, meals, supplements, updated_at)
    values (
      ${date},
      ${next.training_done},
      ${JSON.stringify(next.exercises_done)}::jsonb,
      ${next.activity_choice},
      ${JSON.stringify(next.meals)}::jsonb,
      ${JSON.stringify(next.supplements)}::jsonb,
      now()
    )
    on conflict (date) do update set
      training_done = excluded.training_done,
      exercises_done = excluded.exercises_done,
      activity_choice = excluded.activity_choice,
      meals = excluded.meals,
      supplements = excluded.supplements,
      updated_at = now()
  `;
  return next;
}
```

- [ ] **Step 5: Commit**

```bash
git add db/schema.sql lib/types.ts lib/db.ts package.json package-lock.json
git commit -m "feat: add content/daily_logs schema and db client helpers"
```

---

### Task 3: Seed data and seed script

**Files:**
- Uses (already created, real content, do not regenerate): `db/seed-data/program.json`, `db/seed-data/week-pattern.json`, `db/seed-data/workout-plan.json`, `db/seed-data/meals.json`, `db/seed-data/supplements.json`
- Create: `scripts/seed.ts`
- Modify: `package.json` (add `seed` script and `tsx` dev dependency)

**Interfaces:**
- Consumes: `setContent` from `lib/db.ts`.
- Produces: a populated `content` table (five rows), required by every UI task from Task 7 onward.

- [ ] **Step 1: Install the TypeScript script runner**

```bash
npm install -D tsx
```

- [ ] **Step 2: Write the seed script**

`scripts/seed.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { setContent } from "../lib/db";
import type {
  Meal,
  Program,
  Supplement,
  WeekPatternEntry,
  WorkoutPlan,
} from "../lib/types";

function loadJson<T>(filename: string): T {
  const path = join(process.cwd(), "db", "seed-data", filename);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

async function main() {
  const program = loadJson<Program>("program.json");
  const weekPattern = loadJson<WeekPatternEntry[]>("week-pattern.json");
  const workoutPlan = loadJson<WorkoutPlan>("workout-plan.json");
  const meals = loadJson<Meal[]>("meals.json");
  const supplements = loadJson<Supplement[]>("supplements.json");

  await setContent("program", program);
  await setContent("weekPattern", weekPattern);
  await setContent("workoutPlan", workoutPlan);
  await setContent("meals", meals);
  await setContent("supplements", supplements);

  console.log("Seeded: program, weekPattern, workoutPlan, meals, supplements");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Add the npm script**

In `package.json` `"scripts"`:

```json
"seed": "tsx scripts/seed.ts"
```

- [ ] **Step 4: Run it against a connected database and verify**

This step needs `POSTGRES_URL` set (from Task 11's `vercel env pull`, or a
local Postgres connection string for early development). Once available:

Run: `npm run seed`
Expected: prints `Seeded: program, weekPattern, workoutPlan, meals, supplements` with no errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts package.json package-lock.json
git commit -m "feat: add seed script loading the real program/diet/supplement content"
```

---

### Task 4: Business logic (`lib/program.ts`) and unit tests

**Files:**
- Create: `lib/program.ts`, `lib/program.test.ts`, `vitest.config.ts`
- Modify: `package.json` (add `vitest` dev dependency and `test` script)

**Interfaces:**
- Consumes: `TrainingBlock`, `WeekPatternEntry`, `WorkoutPlan`, `Exercise`, `Meal`, `Supplement`, `DailyLog` from `lib/types.ts`.
- Produces: `getProgramDay(date, startDate): number`, `getWeekNumber(programDay): number`, `getDayPattern(date, weekPattern, dailyLog): ResolvedDayPattern`, `getExercisesForWeek(block, weekNumber): ExerciseForWeek[]`, `isDayComplete(params): boolean` — consumed by `app/actions.ts` and every page component from Task 6 onward.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

Add to `package.json` `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing tests**

`lib/program.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getDayPattern,
  getExercisesForWeek,
  getProgramDay,
  getWeekNumber,
  isDayComplete,
} from "./program";
import type {
  DailyLog,
  Meal,
  Supplement,
  WeekPatternEntry,
  WorkoutBlockContent,
} from "./types";

const weekPattern: WeekPatternEntry[] = [
  { dayOfWeek: 0, trainingBlock: "A", activity: "Cardio", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 1, trainingBlock: "B", activity: "Cardio", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 2, trainingBlock: "C", activity: "Cardio", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 3, trainingBlock: "D", activity: "Cardio", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 4, trainingBlock: "E", activity: "Cardio", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 5, trainingBlock: null, activity: null, activityEditable: true, activityOptions: ["Futebol", "Descanso"] },
  { dayOfWeek: 6, trainingBlock: null, activity: null, activityEditable: true, activityOptions: ["Futebol", "Descanso"] },
];

const blockA: WorkoutBlockContent = {
  focus: "Costas, Peito, Ombro e Panturrilha",
  exercises: [
    { name: "Ex1", reps: "8-12", tempo: "2110", sets: [2, 3, 3, 3, 3, 4, 4, 4] },
    { name: "Ex2", reps: "8-12", tempo: "2110", sets: [2, 2, 2, 3, 3, 4, 4, 4] },
  ],
};

const meals: Meal[] = [
  { id: "cafe", time: "07:00", name: "Café", options: [{ title: "Padrão", items: "x" }] },
];

const supplements: Supplement[] = [{ id: "omega-3", name: "Ômega 3", dose: "2 cápsulas" }];

function emptyLog(date: string): DailyLog {
  return { date, training_done: false, exercises_done: {}, activity_choice: null, meals: {}, supplements: {} };
}

describe("getProgramDay", () => {
  it("returns 1 for the start date", () => {
    expect(getProgramDay("2026-09-14", "2026-09-14")).toBe(1);
  });
  it("counts forward across weeks", () => {
    expect(getProgramDay("2026-09-21", "2026-09-14")).toBe(8);
  });
});

describe("getWeekNumber", () => {
  it("clamps day 1 to week 1", () => {
    expect(getWeekNumber(1)).toBe(1);
  });
  it("clamps day 7 to week 1 and day 8 to week 2", () => {
    expect(getWeekNumber(7)).toBe(1);
    expect(getWeekNumber(8)).toBe(2);
  });
  it("clamps any day past week 8 to week 8", () => {
    expect(getWeekNumber(57)).toBe(8);
  });
});

describe("getDayPattern", () => {
  it("resolves a fixed training day with no log", () => {
    const pattern = getDayPattern("2026-09-14", weekPattern, null); // Monday
    expect(pattern).toEqual({
      trainingBlock: "A",
      activity: "Cardio",
      activityEditable: false,
      activityOptions: [],
    });
  });

  it("overlays activity_choice on an editable weekend day", () => {
    const log = { ...emptyLog("2026-09-19"), activity_choice: "Futebol" };
    const pattern = getDayPattern("2026-09-19", weekPattern, log); // Saturday
    expect(pattern.trainingBlock).toBeNull();
    expect(pattern.activity).toBe("Futebol");
  });

  it("leaves activity null on an editable day with no choice yet", () => {
    const pattern = getDayPattern("2026-09-19", weekPattern, null);
    expect(pattern.activity).toBeNull();
    expect(pattern.activityEditable).toBe(true);
  });
});

describe("getExercisesForWeek", () => {
  it("resolves week 1 set counts", () => {
    expect(getExercisesForWeek(blockA, 1)).toEqual([
      { name: "Ex1", reps: "8-12", tempo: "2110", sets: 2 },
      { name: "Ex2", reps: "8-12", tempo: "2110", sets: 2 },
    ]);
  });

  it("resolves week 8 set counts", () => {
    expect(getExercisesForWeek(blockA, 8)).toEqual([
      { name: "Ex1", reps: "8-12", tempo: "2110", sets: 4 },
      { name: "Ex2", reps: "8-12", tempo: "2110", sets: 4 },
    ]);
  });
});

describe("isDayComplete", () => {
  const today = "2026-09-20";

  it("is false for a future date regardless of log state", () => {
    const pattern = getDayPattern("2026-09-25", weekPattern, null);
    expect(
      isDayComplete({
        date: "2026-09-25",
        today,
        dailyLog: null,
        pattern,
        meals,
        supplements,
      }),
    ).toBe(false);
  });

  it("is true on a rest day once meals and supplements are done, with no training required", () => {
    const pattern = getDayPattern("2026-09-19", weekPattern, { ...emptyLog("2026-09-19"), activity_choice: "Descanso" });
    const log: DailyLog = {
      ...emptyLog("2026-09-19"),
      activity_choice: "Descanso",
      meals: { cafe: { chosenOptionIndex: 0, done: true } },
      supplements: { "omega-3": true },
    };
    expect(isDayComplete({ date: "2026-09-19", today, dailyLog: log, pattern, meals, supplements })).toBe(true);
  });

  it("is false on a training day when training_done is false even if meals/supplements are done", () => {
    const pattern = getDayPattern("2026-09-14", weekPattern, null);
    const log: DailyLog = {
      ...emptyLog("2026-09-14"),
      training_done: false,
      meals: { cafe: { chosenOptionIndex: 0, done: true } },
      supplements: { "omega-3": true },
    };
    expect(isDayComplete({ date: "2026-09-14", today, dailyLog: log, pattern, meals, supplements })).toBe(false);
  });

  it("is true on a training day once training, meals and supplements are all done", () => {
    const pattern = getDayPattern("2026-09-14", weekPattern, null);
    const log: DailyLog = {
      ...emptyLog("2026-09-14"),
      training_done: true,
      meals: { cafe: { chosenOptionIndex: 0, done: true } },
      supplements: { "omega-3": true },
    };
    expect(isDayComplete({ date: "2026-09-14", today, dailyLog: log, pattern, meals, supplements })).toBe(true);
  });
});
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `npx vitest run lib/program.test.ts`
Expected: FAIL — `./program` has no exported members (file doesn't exist yet).

- [ ] **Step 4: Implement `lib/program.ts`**

```ts
import type {
  DailyLog,
  Exercise,
  Meal,
  Supplement,
  WeekPatternEntry,
  WorkoutBlockContent,
} from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 1-indexed day offset from the program's start date. */
export function getProgramDay(date: string, startDate: string): number {
  const diffDays = Math.round((toUtcDate(date) - toUtcDate(startDate)) / MS_PER_DAY);
  return diffDays + 1;
}

/** Program week for a given program day, clamped to [1, 8]. */
export function getWeekNumber(programDay: number): number {
  const week = Math.ceil(programDay / 7);
  return Math.min(8, Math.max(1, week));
}

export interface ResolvedDayPattern {
  trainingBlock: WeekPatternEntry["trainingBlock"];
  activity: string | null;
  activityEditable: boolean;
  activityOptions: string[];
}

/** Weekday's default pattern, with the daily log's activity_choice overlaid. */
export function getDayPattern(
  date: string,
  weekPattern: WeekPatternEntry[],
  dailyLog: DailyLog | null,
): ResolvedDayPattern {
  const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // 0 = Monday .. 6 = Sunday
  const base = weekPattern.find((entry) => entry.dayOfWeek === dayOfWeek);
  if (!base) {
    throw new Error(`weekPattern has no entry for dayOfWeek ${dayOfWeek}`);
  }
  const activity =
    base.activityEditable && dailyLog?.activity_choice
      ? dailyLog.activity_choice
      : base.activity;
  return {
    trainingBlock: base.trainingBlock,
    activity,
    activityEditable: base.activityEditable,
    activityOptions: base.activityOptions,
  };
}

export interface ExerciseForWeek {
  name: string;
  reps: string;
  tempo: string;
  sets: number;
}

/** Flattens a block's exercises to the set count prescribed for one week. */
export function getExercisesForWeek(
  block: WorkoutBlockContent,
  weekNumber: number,
): ExerciseForWeek[] {
  return block.exercises.map((exercise: Exercise) => ({
    name: exercise.name,
    reps: exercise.reps,
    tempo: exercise.tempo,
    sets: exercise.sets[weekNumber - 1],
  }));
}

const REST_ACTIVITIES = new Set(["Nenhuma", "Descanso"]);

export interface IsDayCompleteParams {
  date: string;
  today: string;
  dailyLog: DailyLog | null;
  pattern: ResolvedDayPattern;
  meals: Meal[];
  supplements: Supplement[];
}

export function isDayComplete({
  date,
  today,
  dailyLog,
  pattern,
  meals,
  supplements,
}: IsDayCompleteParams): boolean {
  if (toUtcDate(date) > toUtcDate(today)) return false;
  if (!dailyLog) return false;

  const allMealsDone = meals.every((meal) => dailyLog.meals[meal.id]?.done === true);
  if (!allMealsDone) return false;

  const allSupplementsDone = supplements.every(
    (supplement) => dailyLog.supplements[supplement.id] === true,
  );
  if (!allSupplementsDone) return false;

  const requiresTraining =
    Boolean(pattern.trainingBlock) ||
    (pattern.activity !== null && !REST_ACTIVITIES.has(pattern.activity));
  if (requiresTraining && !dailyLog.training_done) return false;

  return true;
}
```

- [ ] **Step 5: Run the tests again to confirm they pass**

Run: `npx vitest run lib/program.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/program.ts lib/program.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: add pure program business-logic with unit test coverage"
```

---

### Task 5: Shared UI atoms, root layout, bottom tab bar

**Files:**
- Create: `components/Card.tsx`, `components/Chip.tsx`, `components/ProgressBar.tsx`, `components/Checkbox.tsx`, `components/BottomTabBar.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Produces: `<Card>`, `<Chip>`, `<ProgressBar value max />`, `<Checkbox checked onChange label />`, `<BottomTabBar />` — used by every page from Task 7 onward.

- [ ] **Step 1: `components/Card.tsx`**

```tsx
import type { ReactNode } from "react";

export function Card({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = onClick ? "cursor-pointer active:scale-[0.99]" : "";
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition ${interactive} ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: `components/Chip.tsx`**

```tsx
export function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "muted";
}) {
  const toneClasses = {
    neutral: "bg-neutral-100 text-neutral-700",
    success: "bg-emerald-100 text-emerald-800",
    muted: "bg-neutral-50 text-neutral-400",
  }[tone];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 3: `components/ProgressBar.tsx`**

```tsx
export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className="h-full rounded-full bg-neutral-900 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 4: `components/Checkbox.tsx`**

```tsx
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
      />
      <span className={checked ? "text-neutral-400 line-through" : "text-neutral-900"}>
        {label}
      </span>
    </label>
  );
}
```

- [ ] **Step 5: `components/BottomTabBar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Hoje" },
  { href: "/progress", label: "Progresso" },
  { href: "/settings", label: "Config" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-200 bg-white/95 backdrop-blur">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-3 text-center text-sm font-medium ${
              active ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 6: Update the root layout**

`app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { BottomTabBar } from "@/components/BottomTabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Protocolo Jake Tyler",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jake Tyler" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-50 pb-16 text-neutral-900 antialiased">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Verify visually**

Run: `npm run dev`, open `http://localhost:3000`
Expected: page renders with the bottom tab bar fixed at the bottom, "Hoje" highlighted.

- [ ] **Step 8: Commit**

```bash
git add components app/layout.tsx app/globals.css
git commit -m "feat: add shared UI atoms, root layout and bottom tab bar"
```

---

### Task 6: Server Actions

**Files:**
- Create: `app/actions.ts`

**Interfaces:**
- Consumes: `getContent`, `getDailyLog`, `upsertDailyLog`, `setContent` from `lib/db.ts`; `getDayPattern` from `lib/program.ts`; `ContentKey`, `ContentShape` from `lib/types.ts`.
- Produces: `toggleExercise`, `toggleMealDone`, `chooseMealOption`, `toggleSupplement`, `setActivityChoice`, `saveContent` — called directly from client components in Tasks 7 and 9.

- [ ] **Step 1: Write the actions**

`app/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getContent, getDailyLog, setContent, upsertDailyLog } from "@/lib/db";
import { getDayPattern } from "@/lib/program";
import type { ContentKey, ContentShape } from "@/lib/types";

async function recomputeTrainingDone(date: string, exercisesDone: Record<string, boolean>) {
  const [weekPattern, workoutPlan, dailyLog] = await Promise.all([
    getContent("weekPattern"),
    getContent("workoutPlan"),
    getDailyLog(date),
  ]);
  const pattern = getDayPattern(date, weekPattern, dailyLog);
  if (!pattern.trainingBlock) return false;
  const block = workoutPlan[pattern.trainingBlock];
  return block.exercises.every((_, index) => exercisesDone[String(index)] === true);
}

export async function toggleExercise(date: string, exerciseIndex: number, done: boolean) {
  const existing = await getDailyLog(date);
  const exercisesDone = { ...(existing?.exercises_done ?? {}), [String(exerciseIndex)]: done };
  const trainingDone = await recomputeTrainingDone(date, exercisesDone);
  await upsertDailyLog(date, { exercises_done: exercisesDone, training_done: trainingDone });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function toggleMealDone(date: string, mealId: string, done: boolean) {
  const existing = await getDailyLog(date);
  const current = existing?.meals[mealId] ?? { chosenOptionIndex: 0, done: false };
  const meals = { ...(existing?.meals ?? {}), [mealId]: { ...current, done } };
  await upsertDailyLog(date, { meals });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function chooseMealOption(date: string, mealId: string, optionIndex: number) {
  const existing = await getDailyLog(date);
  const current = existing?.meals[mealId] ?? { chosenOptionIndex: 0, done: false };
  const meals = { ...(existing?.meals ?? {}), [mealId]: { ...current, chosenOptionIndex: optionIndex } };
  await upsertDailyLog(date, { meals });
  revalidatePath("/");
}

export async function toggleSupplement(date: string, supplementId: string, done: boolean) {
  const existing = await getDailyLog(date);
  const supplements = { ...(existing?.supplements ?? {}), [supplementId]: done };
  await upsertDailyLog(date, { supplements });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function setActivityChoice(date: string, activity: string | null) {
  await upsertDailyLog(date, { activity_choice: activity });
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function saveContent(
  key: ContentKey,
  jsonText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "JSON inválido — verifique a sintaxe." };
  }
  await setContent(key, parsed as ContentShape[typeof key]);
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/settings");
  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/actions.ts
git commit -m "feat: add server actions for all tracking and settings mutations"
```

---

### Task 7: "Hoje" page — training, meals, supplements

**Files:**
- Create: `components/TrainingCard.tsx`, `components/MealsList.tsx`, `components/SupplementsList.tsx`, `components/WeekView.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getContent`, `getDailyLog` from `lib/db.ts`; `getProgramDay`, `getWeekNumber`, `getDayPattern`, `getExercisesForWeek` from `lib/program.ts`; `toggleExercise`, `toggleMealDone`, `chooseMealOption`, `toggleSupplement`, `setActivityChoice` from `app/actions.ts`.
- Produces: the `/` route.

- [ ] **Step 1: `components/TrainingCard.tsx`** (client component, one day's training)

```tsx
"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Checkbox } from "./Checkbox";
import { Chip } from "./Chip";
import { toggleExercise } from "@/app/actions";
import type { ExerciseForWeek } from "@/lib/program";

export function TrainingCard({
  date,
  block,
  focus,
  exercises,
  exercisesDone,
  trainingDone,
  label,
}: {
  date: string;
  block: string;
  focus: string;
  exercises: ExerciseForWeek[];
  exercisesDone: Record<string, boolean>;
  trainingDone: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [doneMap, setDoneMap] = useState(exercisesDone);

  async function handleToggle(index: number, checked: boolean) {
    setDoneMap((prev) => ({ ...prev, [String(index)]: checked }));
    await toggleExercise(date, index, checked);
  }

  return (
    <Card onClick={() => setOpen((v) => !v)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="font-medium">Treino {block} — {focus}</p>
        </div>
        <Chip label={trainingDone ? "Concluído" : "Pendente"} tone={trainingDone ? "success" : "neutral"} />
      </div>
      {open && (
        <div className="mt-3 border-t border-neutral-100 pt-3" onClick={(e) => e.stopPropagation()}>
          {exercises.map((exercise, index) => (
            <Checkbox
              key={exercise.name}
              checked={doneMap[String(index)] === true}
              onChange={(checked) => handleToggle(index, checked)}
              label={`${exercise.name} — ${exercise.sets}x ${exercise.reps}${exercise.tempo ? ` (tempo ${exercise.tempo})` : ""}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: `components/MealsList.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Checkbox } from "./Checkbox";
import { chooseMealOption, toggleMealDone } from "@/app/actions";
import type { Meal, MealLogEntry } from "@/lib/types";

export function MealsList({
  date,
  meals,
  mealLogs,
}: {
  date: string;
  meals: Meal[];
  mealLogs: Record<string, MealLogEntry>;
}) {
  const [logs, setLogs] = useState(mealLogs);

  async function handleDone(mealId: string, done: boolean) {
    setLogs((prev) => ({ ...prev, [mealId]: { ...(prev[mealId] ?? { chosenOptionIndex: 0, done: false }), done } }));
    await toggleMealDone(date, mealId, done);
  }

  async function handleOption(mealId: string, optionIndex: number) {
    setLogs((prev) => ({ ...prev, [mealId]: { ...(prev[mealId] ?? { chosenOptionIndex: 0, done: false }), chosenOptionIndex: optionIndex } }));
    await chooseMealOption(date, mealId, optionIndex);
  }

  return (
    <Card>
      <p className="mb-2 font-medium">Refeições</p>
      {meals.map((meal) => {
        const log = logs[meal.id] ?? { chosenOptionIndex: 0, done: false };
        const option = meal.options[log.chosenOptionIndex] ?? meal.options[0];
        return (
          <div key={meal.id} className="border-t border-neutral-100 py-2 first:border-t-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{meal.time} — {meal.name}</p>
              {meal.options.length > 1 && (
                <select
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs"
                  value={log.chosenOptionIndex}
                  onChange={(e) => handleOption(meal.id, Number(e.target.value))}
                >
                  {meal.options.map((opt, i) => (
                    <option key={opt.title} value={i}>{opt.title}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="mb-1 text-sm text-neutral-600">{option.items}</p>
            <Checkbox checked={log.done} onChange={(checked) => handleDone(meal.id, checked)} label="Refeição feita" />
          </div>
        );
      })}
    </Card>
  );
}
```

- [ ] **Step 3: `components/SupplementsList.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Checkbox } from "./Checkbox";
import { toggleSupplement } from "@/app/actions";
import type { Supplement } from "@/lib/types";

export function SupplementsList({
  date,
  supplements,
  supplementLogs,
}: {
  date: string;
  supplements: Supplement[];
  supplementLogs: Record<string, boolean>;
}) {
  const [logs, setLogs] = useState(supplementLogs);

  async function handleToggle(id: string, checked: boolean) {
    setLogs((prev) => ({ ...prev, [id]: checked }));
    await toggleSupplement(date, id, checked);
  }

  return (
    <Card>
      <p className="mb-2 font-medium">Suplementos</p>
      {supplements.map((supplement) => (
        <Checkbox
          key={supplement.id}
          checked={logs[supplement.id] === true}
          onChange={(checked) => handleToggle(supplement.id, checked)}
          label={`${supplement.name} — ${supplement.dose}`}
        />
      ))}
    </Card>
  );
}
```

- [ ] **Step 4: `components/WeekView.tsx`** (server component: Mon–Sun of the current program week)

```tsx
import Link from "next/link";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { getContent, getDailyLog } from "@/lib/db";
import { getDayPattern, getProgramDay, getWeekNumber, isDayComplete } from "@/lib/program";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function isoDateNDaysFrom(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export async function WeekView({ today }: { today: string }) {
  const [program, weekPattern, meals, supplements] = await Promise.all([
    getContent("program"),
    getContent("weekPattern"),
    getContent("meals"),
    getContent("supplements"),
  ]);

  const todayProgramDay = getProgramDay(today, program.startDate);
  const jsDay = new Date(`${today}T00:00:00Z`).getUTCDay();
  const todayDayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const weekStart = isoDateNDaysFrom(today, -todayDayOfWeek);

  const days = await Promise.all(
    Array.from({ length: 7 }, (_, i) => i).map(async (i) => {
      const date = isoDateNDaysFrom(weekStart, i);
      const dailyLog = await getDailyLog(date);
      const pattern = getDayPattern(date, weekPattern, dailyLog);
      const complete = isDayComplete({ date, today, dailyLog, pattern, meals, supplements });
      const programDay = getProgramDay(date, program.startDate);
      return { date, label: WEEKDAY_LABELS[i], pattern, complete, isToday: date === today, programDay };
    }),
  );

  return (
    <Card>
      <p className="mb-2 font-medium">Semana {getWeekNumber(todayProgramDay)}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <Link key={day.date} href={day.isToday ? "/" : `/?date=${day.date}`} className="text-center">
            <p className="text-xs text-neutral-400">{day.label}</p>
            <div
              className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                day.complete
                  ? "bg-emerald-500 text-white"
                  : day.programDay > todayProgramDay
                    ? "bg-neutral-100 text-neutral-300"
                    : "bg-neutral-200 text-neutral-600"
              } ${day.isToday ? "ring-2 ring-neutral-900 ring-offset-1" : ""}`}
            >
              {day.pattern.trainingBlock ?? "•"}
            </div>
          </Link>
        ))}
      </div>
      {days.some((d) => !d.pattern.trainingBlock && d.pattern.activity) && (
        <div className="mt-2">
          <Chip label="Legenda: letra = bloco de treino, • = dia de atividade" tone="muted" />
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 5: `app/page.tsx`** (server component, composes everything for "today")

```tsx
import { ProgressBar } from "@/components/ProgressBar";
import { MealsList } from "@/components/MealsList";
import { SupplementsList } from "@/components/SupplementsList";
import { TrainingCard } from "@/components/TrainingCard";
import { WeekView } from "@/components/WeekView";
import { getContent, getDailyLog } from "@/lib/db";
import { getDayPattern, getExercisesForWeek, getProgramDay, getWeekNumber } from "@/lib/program";
import { setActivityChoice } from "@/app/actions";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function HojePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayIso();
  const today = todayIso();

  const [program, weekPattern, workoutPlan, meals, supplements, dailyLog] = await Promise.all([
    getContent("program"),
    getContent("weekPattern"),
    getContent("workoutPlan"),
    getContent("meals"),
    getContent("supplements"),
    getDailyLog(date),
  ]);

  const programDay = getProgramDay(date, program.startDate);
  const weekNumber = getWeekNumber(programDay);
  const pattern = getDayPattern(date, weekPattern, dailyLog);

  const mealsDoneCount = meals.filter((m) => dailyLog?.meals[m.id]?.done).length;
  const trainingDaysThisWeek = weekPattern.filter((p) => p.trainingBlock).length;

  return (
    <main className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">
          {date === today ? "Hoje" : new Date(`${date}T00:00:00Z`).toLocaleDateString("pt-BR")}
        </h1>
        <p className="text-sm text-neutral-500">Semana {weekNumber} de 8</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Refeições hoje</p>
          <p className="mb-1 text-lg font-semibold">{mealsDoneCount}/{meals.length}</p>
          <ProgressBar value={mealsDoneCount} max={meals.length} />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Treinos na semana</p>
          <p className="mb-1 text-lg font-semibold">{dailyLog?.training_done ? 1 : 0}/{trainingDaysThisWeek}</p>
          <ProgressBar value={dailyLog?.training_done ? 1 : 0} max={trainingDaysThisWeek} />
        </div>
      </div>

      <WeekView today={today} />

      {pattern.trainingBlock ? (
        <TrainingCard
          date={date}
          block={pattern.trainingBlock}
          focus={workoutPlan[pattern.trainingBlock].focus}
          exercises={getExercisesForWeek(workoutPlan[pattern.trainingBlock], weekNumber)}
          exercisesDone={dailyLog?.exercises_done ?? {}}
          trainingDone={dailyLog?.training_done ?? false}
          label="Treino de hoje"
        />
      ) : (
        <ActivityPicker date={date} pattern={pattern} />
      )}

      <MealsList date={date} meals={meals} mealLogs={dailyLog?.meals ?? {}} />
      <SupplementsList date={date} supplements={supplements} supplementLogs={dailyLog?.supplements ?? {}} />
    </main>
  );
}

async function ActivityPicker({
  date,
  pattern,
}: {
  date: string;
  pattern: ReturnType<typeof getDayPattern>;
}) {
  "use server";
  async function pick(formData: FormData) {
    "use server";
    const activity = String(formData.get("activity"));
    await setActivityChoice(date, activity || null);
  }
  return (
    <form action={pick} className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="mb-2 font-medium">Atividade de hoje</p>
      <div className="flex flex-wrap gap-2">
        {pattern.activityOptions.map((option: string) => (
          <button
            key={option}
            type="submit"
            name="activity"
            value={option}
            className={`rounded-full px-3 py-1.5 text-sm ${
              pattern.activity === option ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Verify against the seeded database**

This needs Task 3's seed to have run against a real database (see Task 11 for
provisioning if not done yet).

Run: `npm run dev`, open `http://localhost:3000`
Expected: today's training block (or activity picker on a weekend), the week
strip, meals with their options, and supplements all render; toggling a
checkbox persists after a page refresh.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/TrainingCard.tsx components/MealsList.tsx components/SupplementsList.tsx components/WeekView.tsx
git commit -m "feat: build the Hoje page with training, meals and supplements tracking"
```

---

### Task 8: "Progresso" page — heatmap and stats

**Files:**
- Create: `components/Heatmap.tsx`
- Modify: `app/progress/page.tsx` (new file)

**Interfaces:**
- Consumes: `getContent`, `getDailyLog` from `lib/db.ts`; `getProgramDay`, `getWeekNumber`, `getDayPattern`, `isDayComplete` from `lib/program.ts`.
- Produces: the `/progress` route.

- [ ] **Step 1: `components/Heatmap.tsx`**

```tsx
import { Chip } from "./Chip";

export interface HeatmapDay {
  date: string;
  weekNumber: number;
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  status: "complete" | "incomplete" | "future";
}

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);
  const colorFor = (status: HeatmapDay["status"]) =>
    status === "complete" ? "bg-emerald-500" : status === "incomplete" ? "bg-neutral-300" : "bg-neutral-100";

  return (
    <div>
      <div className="flex gap-1.5">
        {weeks.map((week) => (
          <div key={week} className="flex flex-col gap-1.5">
            {Array.from({ length: 7 }, (_, dow) => {
              const day = days.find((d) => d.weekNumber === week && d.dayOfWeek === dow);
              return (
                <div
                  key={dow}
                  title={day?.date}
                  className={`h-3.5 w-3.5 rounded-sm ${day ? colorFor(day.status) : "bg-transparent"}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Chip label="Completo" tone="success" />
        <Chip label="Incompleto" tone="neutral" />
        <Chip label="Futuro" tone="muted" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `app/progress/page.tsx`**

```tsx
import { Heatmap, type HeatmapDay } from "@/components/Heatmap";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { getContent, getDailyLog } from "@/lib/db";
import { getDayPattern, getProgramDay, getWeekNumber, isDayComplete } from "@/lib/program";

function isoDateNDaysFrom(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default async function ProgressPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [program, weekPattern, meals, supplements] = await Promise.all([
    getContent("program"),
    getContent("weekPattern"),
    getContent("meals"),
    getContent("supplements"),
  ]);

  const totalDays = program.durationWeeks * 7;
  const days: HeatmapDay[] = [];
  let completedCount = 0;
  let elapsedCount = 0;
  let currentStreak = 0;

  for (let offset = 0; offset < totalDays; offset++) {
    const date = isoDateNDaysFrom(program.startDate, offset);
    const programDay = offset + 1;
    const weekNumber = getWeekNumber(programDay);
    const dayOfWeek = offset % 7;
    const isFuture = date > today;

    const dailyLog = isFuture ? null : await getDailyLog(date);
    const pattern = getDayPattern(date, weekPattern, dailyLog);
    const complete = !isFuture && isDayComplete({ date, today, dailyLog, pattern, meals, supplements });

    days.push({ date, weekNumber, dayOfWeek, status: isFuture ? "future" : complete ? "complete" : "incomplete" });

    if (!isFuture) {
      elapsedCount += 1;
      if (complete) {
        completedCount += 1;
        currentStreak += 1;
      } else {
        currentStreak = 0;
      }
    }
  }

  const completionRate = elapsedCount === 0 ? 0 : Math.round((completedCount / elapsedCount) * 100);

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Progresso</h1>

      <Card>
        <Heatmap days={days} />
      </Card>

      <Card>
        <p className="text-xs text-neutral-500">Dias completos / dias decorridos</p>
        <p className="mb-1 text-lg font-semibold">{completedCount}/{elapsedCount} ({completionRate}%)</p>
        <ProgressBar value={completedCount} max={elapsedCount || 1} />
      </Card>

      <Card>
        <p className="text-xs text-neutral-500">Sequência atual</p>
        <p className="text-lg font-semibold">{currentStreak} {currentStreak === 1 ? "dia" : "dias"}</p>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`, open `http://localhost:3000/progress`
Expected: an 8-column, 7-row heatmap renders, future days are pale, past days
reflect the seeded/tracked data, and the stat cards show sensible numbers.

- [ ] **Step 4: Commit**

```bash
git add app/progress/page.tsx components/Heatmap.tsx
git commit -m "feat: build the Progresso page with heatmap and completion stats"
```

---

### Task 9: "Config" page — JSON-paste settings

**Files:**
- Create: `components/SettingsPanel.tsx`
- Modify: `app/settings/page.tsx` (new file)

**Interfaces:**
- Consumes: `getContent` from `lib/db.ts`; `saveContent` from `app/actions.ts`.
- Produces: the `/settings` route.

- [ ] **Step 1: `components/SettingsPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Card } from "./Card";
import { saveContent } from "@/app/actions";
import type { ContentKey } from "@/lib/types";

export function SettingsPanel({
  contentKey,
  title,
  initialData,
}: {
  contentKey: ContentKey;
  title: string;
  initialData: unknown;
}) {
  const [text, setText] = useState(JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    const result = await saveContent(contentKey, text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <Card>
      <p className="mb-2 font-medium">{title}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2 font-mono text-xs"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-1 text-sm text-emerald-600">Salvo.</p>}
      <button
        onClick={handleSave}
        className="mt-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Salvar
      </button>
    </Card>
  );
}
```

- [ ] **Step 2: `app/settings/page.tsx`**

```tsx
import { SettingsPanel } from "@/components/SettingsPanel";
import { getContent } from "@/lib/db";
import type { ContentKey } from "@/lib/types";

const PANELS: { key: ContentKey; title: string }[] = [
  { key: "program", title: "Programa" },
  { key: "weekPattern", title: "Padrão da Semana" },
  { key: "workoutPlan", title: "Plano de Treino" },
  { key: "meals", title: "Refeições" },
  { key: "supplements", title: "Suplementos" },
];

export default async function SettingsPage() {
  const data = await Promise.all(PANELS.map((panel) => getContent(panel.key)));

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Config</h1>
      <p className="text-sm text-neutral-500">
        Cole um JSON novo em qualquer painel e salve — sem precisar mexer em código.
      </p>
      {PANELS.map((panel, i) => (
        <SettingsPanel key={panel.key} contentKey={panel.key} title={panel.title} initialData={data[i]} />
      ))}
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`, open `http://localhost:3000/settings`
Expected: five panels pre-filled with the current content; editing a value
and saving updates the database and is reflected back on `/` after a refresh;
pasting invalid JSON shows the inline error and writes nothing.

- [ ] **Step 4: Commit**

```bash
git add app/settings/page.tsx components/SettingsPanel.tsx
git commit -m "feat: build the Config page for JSON-paste plan editing"
```

---

### Task 10: PWA manifest and icons

**Files:**
- Create: `app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`

**Interfaces:**
- Produces: `/manifest.webmanifest`, `/icon`, `/apple-icon` routes that Next.js links into `<head>` automatically.

- [ ] **Step 1: `app/manifest.ts`**

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Protocolo Jake Tyler",
    short_name: "Jake Tyler",
    description: "Acompanhamento de treino, dieta e suplementação — Protocolo Jake Tyler",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#171717",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
```

- [ ] **Step 2: `app/icon.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
          color: "#fafafa",
          fontSize: 220,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        JT
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 3: `app/apple-icon.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
          color: "#fafafa",
          fontSize: 78,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        JT
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, open `http://localhost:3000/manifest.webmanifest`,
`http://localhost:3000/icon`, `http://localhost:3000/apple-icon`
Expected: manifest JSON renders correctly and both icon routes return a PNG.

- [ ] **Step 5: Commit**

```bash
git add app/manifest.ts app/icon.tsx app/apple-icon.tsx
git commit -m "feat: add PWA manifest and generated home-screen icons"
```

---

### Task 11: Provision Postgres and deploy to Vercel

**Files:** none (infrastructure/deploy task).

**Interfaces:** none — this task makes Tasks 3–9's database calls work against
a real deployed database.

This task needs the user live for `vercel login` and to approve provisioning
a database. Follow the `vercel:marketplace` / `vercel:vercel-storage` skills
for the current Marketplace provisioning flow (Vercel Postgres is now offered
as a Marketplace-provisioned Neon database, not a standalone product).

- [ ] **Step 1: Link the Vercel project**

```bash
vercel login
vercel link
```

- [ ] **Step 2: Provision a Postgres database via the Marketplace**

```bash
vercel integration add neon
```

Follow the interactive prompts to create a new Neon Postgres database and
attach it to this project. If the CLI can't complete this non-interactively,
create it once in the Vercel dashboard (Storage tab) and attach it to the
project instead.

- [ ] **Step 3: Pull the environment variables**

```bash
vercel env pull .env.local
```

Expected: `.env.local` now contains a working `POSTGRES_URL` (or equivalent
Neon-provided variable — check its exact name and, if different, alias it to
`POSTGRES_URL` in `.env.local` since `lib/db.ts` reads the `@vercel/postgres`
default).

- [ ] **Step 4: Apply the schema and seed data**

```bash
psql "$(grep POSTGRES_URL .env.local | cut -d '=' -f2- | tr -d '"')" -f db/schema.sql
npm run seed
```

Expected: no errors; `npm run seed` prints the success line from Task 3.

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 6: Deploy**

```bash
vercel deploy --prod
```

Expected: a production URL is printed. Open it and confirm `/`, `/progress`
and `/settings` all load real data (the Vercel project's GitHub integration
will also auto-deploy on future pushes to `main`).

- [ ] **Step 7: Verify on a phone**

Open the production URL on an iPhone, use "Add to Home Screen", and confirm
the app icon and standalone (no browser chrome) launch work.

---

## Self-Review

**Spec coverage:**
- Data model (`content` + `daily_logs`, exact shapes) — Task 2. ✅
- Business rules (`getProgramDay`, `getWeekNumber`, `getDayPattern`, `isDayComplete`) with unit tests — Task 4. ✅
- `/` Hoje tab (summary cards, week view, training checklist, meals with options, supplements) — Task 7. ✅
- `/progress` heatmap + stats — Task 8. ✅
- `/settings` JSON paste panels — Task 9. ✅
- Bottom tab bar — Task 5. ✅
- Server Actions only, no REST layer — Task 6. ✅
- PWA manifest + icons, no service worker — Task 10. ✅
- Seed data from the real PDFs, one-time script — Task 3. ✅
- Deployment (link, provision Postgres, schema, seed, push, deploy) — Task 11. ✅

**Placeholder scan:** no TBDs; all seed content is the real extracted
program/diet/supplement data; all code steps show complete, working code.

**Type consistency:** `ContentKey`/`ContentShape` (Task 2) are used unchanged
through `db.ts`, `actions.ts`, and the settings page. `DailyLog`,
`MealLogEntry` (Task 2) match the shapes read/written in `actions.ts` (Task 6)
and rendered in `MealsList`/`SupplementsList`/`TrainingCard` (Task 7).
`ResolvedDayPattern`/`ExerciseForWeek` (Task 4) are the exact types consumed
by `WeekView` and `app/page.tsx` (Task 7) and `ProgressPage` (Task 8).

## Known data gaps to flag to the user

- Block D's "Stiff com Halteres" has no tempo code in the source PDF (every
  other exercise has one) — seeded with `tempo: ""`. Fixable any time via
  `/settings` → Plano de Treino.
- The weekly pattern (which day trains which block, and that cardio is
  Mon–Fri post-treino with Sat/Sun free for futebol/corrida/descanso) was
  inferred from the PDF's "Segunda a sexta" cardio note, since the source
  didn't give an explicit day-by-block table. It's fully editable via
  `/settings` → Padrão da Semana if the actual weekly split differs.
- `program.startDate` is carried over from the previously approved spec
  (2026-09-14) — confirm or edit via `/settings` → Programa if the real start
  date is different.
