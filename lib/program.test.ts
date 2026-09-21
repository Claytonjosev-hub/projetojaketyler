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
