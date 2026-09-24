import { describe, expect, it } from "vitest";
import {
  formatDayMonth,
  formatWeekSummary,
  getDayOfWeek,
  getDayPattern,
  getProgramDay,
  getProgramTotalDays,
  getProgramWeeks,
  getWeekNumber,
  isDayComplete,
  isRestActivity,
} from "./program";
import type { DailyLog, Meal, Supplement, WeekPatternEntry } from "./types";

const weekPattern: WeekPatternEntry[] = [
  { dayOfWeek: 0, trainingBlock: "pull", activity: "Cardio 30 min", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 1, trainingBlock: "push", activity: "Cardio 30 min", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 2, trainingBlock: "legs", activity: "Cardio 30 min", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 3, trainingBlock: null, activity: null, activityEditable: true, activityOptions: ["Futebol", "Descanso"] },
  { dayOfWeek: 4, trainingBlock: "upper", activity: "Cardio 30 min", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 5, trainingBlock: "legs2", activity: "Cardio 30 min", activityEditable: false, activityOptions: [] },
  { dayOfWeek: 6, trainingBlock: null, activity: null, activityEditable: true, activityOptions: ["Futebol", "Descanso"] },
];

const meals: Meal[] = [
  { id: "cafe", time: "07:00", name: "Café", options: [{ title: "Padrão", items: "x" }] },
];

const supplements: Supplement[] = [{ id: "omega-3", name: "Ômega 3", dose: "2 cápsulas" }];

function emptyLog(date: string): DailyLog {
  return {
    date,
    training_done: false,
    exercises_done: {},
    activity_choice: null,
    meals: {},
    supplements: {},
    note: "",
  };
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
    expect(getWeekNumber(1, 15)).toBe(1);
  });
  it("clamps day 7 to week 1 and day 8 to week 2", () => {
    expect(getWeekNumber(7, 15)).toBe(1);
    expect(getWeekNumber(8, 15)).toBe(2);
  });
  it("never goes past the program's own length", () => {
    expect(getWeekNumber(500, 15)).toBe(15);
    expect(getWeekNumber(57, 8)).toBe(8);
  });
});

describe("program length", () => {
  const program = { startDate: "2026-09-24", endDate: "2026-12-31" };

  it("counts both ends of the window", () => {
    expect(getProgramTotalDays(program)).toBe(99);
  });

  it("rounds a partial final week up", () => {
    expect(getProgramWeeks(program)).toBe(15);
    expect(getProgramWeeks({ startDate: "2026-09-24", endDate: "2026-09-30" })).toBe(1);
    expect(getProgramWeeks({ startDate: "2026-09-24", endDate: "2026-10-01" })).toBe(2);
  });
});

describe("getDayPattern", () => {
  it("resolves a fixed training day with no log", () => {
    const pattern = getDayPattern("2026-09-14", weekPattern, null); // Monday
    expect(pattern).toEqual({
      trainingBlock: "pull",
      activity: "Cardio 30 min",
      activityEditable: false,
      activityOptions: [],
    });
  });

  it("resolves Saturday to the second legs block", () => {
    expect(getDayPattern("2026-09-19", weekPattern, null).trainingBlock).toBe("legs2");
  });

  it("overlays activity_choice on an editable rest day", () => {
    const log = { ...emptyLog("2026-09-17"), activity_choice: "Futebol" };
    const pattern = getDayPattern("2026-09-17", weekPattern, log); // Thursday
    expect(pattern.trainingBlock).toBeNull();
    expect(pattern.activity).toBe("Futebol");
  });

  it("leaves activity null on an editable day with no choice yet", () => {
    const pattern = getDayPattern("2026-09-17", weekPattern, null);
    expect(pattern.activity).toBeNull();
    expect(pattern.activityEditable).toBe(true);
  });
});

describe("isRestActivity", () => {
  it("treats no choice and rest labels as rest", () => {
    expect(isRestActivity(null)).toBe(true);
    expect(isRestActivity("Descanso")).toBe(true);
  });
  it("treats a real activity as not rest", () => {
    expect(isRestActivity("Futebol")).toBe(false);
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
    const pattern = getDayPattern("2026-09-17", weekPattern, { ...emptyLog("2026-09-17"), activity_choice: "Descanso" });
    const log: DailyLog = {
      ...emptyLog("2026-09-17"),
      activity_choice: "Descanso",
      meals: { cafe: { chosenOptionIndex: 0, done: true } },
      supplements: { "omega-3": true },
    };
    expect(isDayComplete({ date: "2026-09-17", today, dailyLog: log, pattern, meals, supplements })).toBe(true);
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

describe("getDayOfWeek", () => {
  it("maps Monday to 0 and Sunday to 6", () => {
    expect(getDayOfWeek("2026-09-21")).toBe(0);
    expect(getDayOfWeek("2026-09-27")).toBe(6);
  });
});

describe("formatDayMonth", () => {
  it("formats an ISO date in Portuguese short form", () => {
    expect(formatDayMonth("2026-09-21")).toBe("21 set");
    expect(formatDayMonth("2026-01-05")).toBe("5 jan");
  });
});

describe("formatWeekSummary", () => {
  const base = {
    weekNumber: 1,
    firstDate: "2026-09-21",
    lastDate: "2026-09-27",
    daysElapsed: 7,
    daysComplete: 4,
    trainingsDone: 5,
    trainingsRequired: 6,
    mealsDone: 38,
    mealsTotal: 42,
  };

  it("lists the stats and each day's note", () => {
    expect(
      formatWeekSummary({
        ...base,
        notes: [
          { date: "2026-09-21", note: "treino rendeu bem" },
          { date: "2026-09-22", note: "pulei o lanche da tarde" },
        ],
      }),
    ).toBe(
      [
        "Semana 1 · 21 set a 27 set",
        "Dias completos: 4/7",
        "Treinos: 5/6",
        "Refeições: 38/42",
        "",
        "seg 21 set — treino rendeu bem",
        "ter 22 set — pulei o lanche da tarde",
      ].join("\n"),
    );
  });

  it("omits the notes block when there are no notes", () => {
    expect(formatWeekSummary({ ...base, notes: [] })).toBe(
      ["Semana 1 · 21 set a 27 set", "Dias completos: 4/7", "Treinos: 5/6", "Refeições: 38/42"].join("\n"),
    );
  });
});
