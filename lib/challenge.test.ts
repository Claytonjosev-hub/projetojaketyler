import { describe, expect, it } from "vitest";
import { scoreDay, tallyDays, type DayScore } from "./challenge";
import type { DailyLog, Meal, Supplement } from "./types";
import type { ResolvedDayPattern } from "./program";

const trainingDay: ResolvedDayPattern = {
  trainingBlock: "pull",
  activity: "Cardio 30 min",
  activityEditable: false,
  activityOptions: [],
};

const restDay: ResolvedDayPattern = {
  trainingBlock: null,
  activity: "Descanso",
  activityEditable: true,
  activityOptions: ["Futebol", "Descanso"],
};

function meals(count: number): Meal[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `meal-${i}`,
    time: "07:00",
    name: `Refeição ${i}`,
    options: [{ title: "Padrão", items: "x" }],
  }));
}

const supplements: Supplement[] = [
  { id: "omega-3", name: "Ômega 3", dose: "" },
  { id: "multi", name: "Multivitamínico", dose: "" },
];

function log(partial: Partial<DailyLog>): DailyLog {
  return {
    date: "2026-09-24",
    training_done: false,
    exercises_done: {},
    activity_choice: null,
    meals: {},
    supplements: {},
    note: "",
    ...partial,
  };
}

describe("scoreDay", () => {
  it("is 0 with nothing logged", () => {
    const score = scoreDay({ dailyLog: null, pattern: trainingDay, meals: meals(6), supplements });
    expect(score.percent).toBe(0);
    expect(score.itemsTotal).toBe(9); // 6 meals + 2 supplements + training
  });

  it("is 100 when the whole day is done", () => {
    const score = scoreDay({
      dailyLog: log({
        training_done: true,
        meals: Object.fromEntries(
          meals(6).map((m) => [m.id, { chosenOptionIndex: 0, done: true }]),
        ),
        supplements: { "omega-3": true, multi: true },
      }),
      pattern: trainingDay,
      meals: meals(6),
      supplements,
    });
    expect(score.percent).toBe(100);
  });

  it("does not count training on a rest day", () => {
    const score = scoreDay({ dailyLog: null, pattern: restDay, meals: meals(4), supplements });
    expect(score.itemsTotal).toBe(6); // 4 meals + 2 supplements, no training
    expect(score.trainingRequired).toBe(false);
  });

  it("scores two different diets on the same scale", () => {
    const sixMeals = scoreDay({
      dailyLog: log({
        meals: Object.fromEntries(
          meals(6).map((m, i) => [m.id, { chosenOptionIndex: 0, done: i < 3 }]),
        ),
      }),
      pattern: restDay,
      meals: meals(6),
      supplements: [],
    });
    const fourMeals = scoreDay({
      dailyLog: log({
        meals: Object.fromEntries(
          meals(4).map((m, i) => [m.id, { chosenOptionIndex: 0, done: i < 2 }]),
        ),
      }),
      pattern: restDay,
      meals: meals(4),
      supplements: [],
    });
    expect(sixMeals.percent).toBe(50);
    expect(fourMeals.percent).toBe(50);
  });
});

describe("tallyDays", () => {
  const day = (percent: number, extra: Partial<DayScore> = {}): DayScore => ({
    percent,
    itemsDone: 0,
    itemsTotal: 10,
    trainingRequired: true,
    trainingDone: percent === 100,
    ...extra,
  });

  it("adds up points and perfect days", () => {
    const totals = tallyDays([day(100), day(60), day(100)]);
    expect(totals.points).toBe(260);
    expect(totals.perfectDays).toBe(2);
    expect(totals.trainingsRequired).toBe(3);
    expect(totals.trainingsDone).toBe(2);
  });

  it("counts the streak back from the most recent day", () => {
    expect(tallyDays([day(100), day(40), day(100), day(100)]).streak).toBe(2);
    expect(tallyDays([day(100), day(100), day(90)]).streak).toBe(0);
  });

  it("handles an empty window", () => {
    expect(tallyDays([])).toEqual({
      points: 0,
      perfectDays: 0,
      trainingsDone: 0,
      trainingsRequired: 0,
      streak: 0,
    });
  });
});
