import type { DailyLog, Meal, Supplement, WeekPatternEntry } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Today's date as "YYYY-MM-DD", resolved in the given IANA timezone (defaults to the app's locale). */
export function todayIso(timeZone: string = "America/Fortaleza"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

const REST_ACTIVITIES = new Set(["Nenhuma", "Descanso"]);

/** True when the given activity choice represents rest (no activity to mark done). */
export function isRestActivity(activity: string | null): boolean {
  return activity === null || REST_ACTIVITIES.has(activity);
}

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
