import { isRestActivity, type ResolvedDayPattern } from "./program";
import type { DailyLog, Meal, Supplement, User } from "./types";

export interface DayScoreInput {
  dailyLog: DailyLog | null;
  pattern: ResolvedDayPattern;
  meals: Meal[];
  supplements: Supplement[];
}

export interface DayScore {
  /** 0-100: share of that day's own checklist that got done. */
  percent: number;
  itemsDone: number;
  itemsTotal: number;
  trainingRequired: boolean;
  trainingDone: boolean;
}

/**
 * Scores a day as a percentage of that person's own plan, so two people with
 * different diets (six meals vs four) can still be compared fairly.
 */
export function scoreDay({ dailyLog, pattern, meals, supplements }: DayScoreInput): DayScore {
  const trainingRequired =
    Boolean(pattern.trainingBlock) || !isRestActivity(pattern.activity);
  const trainingDone = trainingRequired && Boolean(dailyLog?.training_done);

  const mealsDone = meals.filter((meal) => dailyLog?.meals[meal.id]?.done).length;
  const supplementsDone = supplements.filter((s) => dailyLog?.supplements[s.id]).length;

  const itemsDone = mealsDone + supplementsDone + (trainingDone ? 1 : 0);
  const itemsTotal = meals.length + supplements.length + (trainingRequired ? 1 : 0);

  return {
    percent: itemsTotal === 0 ? 0 : Math.round((itemsDone / itemsTotal) * 100),
    itemsDone,
    itemsTotal,
    trainingRequired,
    trainingDone,
  };
}

export interface ChallengeTotals {
  /** Sum of daily percentages — a flawless day is worth 100. */
  points: number;
  perfectDays: number;
  trainingsDone: number;
  trainingsRequired: number;
  /** Flawless days in a row, counting back from the last day of the window. */
  streak: number;
}

export function tallyDays(scores: DayScore[]): ChallengeTotals {
  const totals: ChallengeTotals = {
    points: 0,
    perfectDays: 0,
    trainingsDone: 0,
    trainingsRequired: 0,
    streak: 0,
  };

  for (const score of scores) {
    totals.points += score.percent;
    if (score.percent === 100) totals.perfectDays += 1;
    if (score.trainingRequired) totals.trainingsRequired += 1;
    if (score.trainingDone) totals.trainingsDone += 1;
  }

  for (let i = scores.length - 1; i >= 0; i--) {
    if (scores[i].percent !== 100) break;
    totals.streak += 1;
  }

  return totals;
}

export interface Contender {
  user: User;
  totals: ChallengeTotals;
  /** Day percentage keyed by "YYYY-MM-DD". */
  scoresByDate: Record<string, number>;
}
