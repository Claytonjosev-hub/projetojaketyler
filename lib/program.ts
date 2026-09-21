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

const WEEKDAY_SHORT = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Weekday index for a date, 0 = Monday .. 6 = Sunday. */
export function getDayOfWeek(date: string): number {
  const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** "2026-09-21" -> "21 set" */
export function formatDayMonth(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day} ${MONTHS_SHORT[month - 1]}`;
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
  const dayOfWeek = getDayOfWeek(date);
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

export interface DayNote {
  date: string;
  note: string;
}

export interface WeekSummary {
  weekNumber: number;
  firstDate: string;
  lastDate: string;
  daysElapsed: number;
  daysComplete: number;
  trainingsDone: number;
  trainingsRequired: number;
  mealsDone: number;
  mealsTotal: number;
  notes: DayNote[];
}

/** Week recap as plain text, ready to paste into the weekly WhatsApp feedback. */
export function formatWeekSummary(summary: WeekSummary): string {
  const lines = [
    `Semana ${summary.weekNumber} · ${formatDayMonth(summary.firstDate)} a ${formatDayMonth(summary.lastDate)}`,
    `Dias completos: ${summary.daysComplete}/${summary.daysElapsed}`,
    `Treinos: ${summary.trainingsDone}/${summary.trainingsRequired}`,
    `Refeições: ${summary.mealsDone}/${summary.mealsTotal}`,
  ];

  if (summary.notes.length > 0) {
    lines.push("");
    for (const entry of summary.notes) {
      lines.push(
        `${WEEKDAY_SHORT[getDayOfWeek(entry.date)]} ${formatDayMonth(entry.date)} — ${entry.note}`,
      );
    }
  }

  return lines.join("\n");
}
