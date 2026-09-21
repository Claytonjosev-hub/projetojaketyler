import { Heatmap, type HeatmapDay } from "@/components/Heatmap";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { WeekSummaryCard } from "@/components/WeekSummaryCard";
import { getContent, getDailyLog } from "@/lib/db";
import {
  formatWeekSummary,
  getDayOfWeek,
  getDayPattern,
  getProgramDay,
  getWeekNumber,
  isDayComplete,
  isRestActivity,
  todayIso,
  type WeekSummary,
} from "@/lib/program";

export const dynamic = "force-dynamic";

function isoDateNDaysFrom(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default async function ProgressPage() {
  const today = todayIso();
  const [program, weekPattern, meals, supplements] = await Promise.all([
    getContent("program"),
    getContent("weekPattern"),
    getContent("meals"),
    getContent("supplements"),
  ]);

  const totalDays = program.durationWeeks * 7;
  const days: HeatmapDay[] = [];
  const weekSummaries = new Map<number, WeekSummary>();
  let completedCount = 0;
  let elapsedCount = 0;
  let currentStreak = 0;

  for (let offset = 0; offset < totalDays; offset++) {
    const date = isoDateNDaysFrom(program.startDate, offset);
    const programDay = getProgramDay(date, program.startDate);
    const weekNumber = getWeekNumber(programDay);
    const dayOfWeek = getDayOfWeek(date);
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

      const week = weekSummaries.get(weekNumber) ?? {
        weekNumber,
        firstDate: date,
        lastDate: date,
        daysElapsed: 0,
        daysComplete: 0,
        trainingsDone: 0,
        trainingsRequired: 0,
        mealsDone: 0,
        mealsTotal: 0,
        notes: [],
      };

      const requiresTraining =
        Boolean(pattern.trainingBlock) || !isRestActivity(pattern.activity);

      week.lastDate = date;
      week.daysElapsed += 1;
      week.daysComplete += complete ? 1 : 0;
      week.trainingsRequired += requiresTraining ? 1 : 0;
      week.trainingsDone += requiresTraining && dailyLog?.training_done ? 1 : 0;
      week.mealsTotal += meals.length;
      week.mealsDone += meals.filter((meal) => dailyLog?.meals[meal.id]?.done).length;
      if (dailyLog?.note) {
        week.notes.push({ date, note: dailyLog.note });
      }

      weekSummaries.set(weekNumber, week);
    }
  }

  const weeks = [...weekSummaries.values()].sort((a, b) => b.weekNumber - a.weekNumber);

  const completionRate = elapsedCount === 0 ? 0 : Math.round((completedCount / elapsedCount) * 100);

  const currentMonth = today.slice(0, 7);
  const monthDays = days.filter((d) => d.date.slice(0, 7) === currentMonth);
  const monthElapsed = monthDays.filter((d) => d.status !== "future").length;
  const monthCompleted = monthDays.filter((d) => d.status === "complete").length;
  const monthRate = monthElapsed === 0 ? 0 : Math.round((monthCompleted / monthElapsed) * 100);
  const monthLabelRaw = new Date(`${today}T00:00:00Z`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);

  return (
    <main className="mx-auto max-w-lg space-y-3 p-4 pt-8">
      <h1 className="px-1 pb-2 text-[32px] font-extrabold leading-none tracking-tight">Progresso</h1>

      <Card className="p-5">
        <p className="mb-3 text-xs font-medium text-ink-faint">
          {program.durationWeeks} semanas · cada coluna é uma semana
        </p>
        <Heatmap days={days} weeks={program.durationWeeks} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-5">
          <p className="text-xs font-medium text-ink-faint">Sequência atual</p>
          <p className="tnum mt-2 text-3xl font-extrabold leading-none">
            {currentStreak}
            <span className="ml-1 text-base font-medium text-ink-dim">
              {currentStreak === 1 ? "dia" : "dias"}
            </span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-ink-faint">Dias completos</p>
          <p className="tnum mt-2 text-3xl font-extrabold leading-none">
            {completionRate}
            <span className="ml-0.5 text-base font-medium text-ink-dim">%</span>
          </p>
          <p className="tnum mt-1 text-xs text-ink-faint">
            {completedCount} de {elapsedCount}
          </p>
        </Card>
      </div>

      {monthElapsed > 0 && (
        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-ink-faint">{monthLabel}</p>
            <p className="tnum text-sm text-ink-dim">
              {monthCompleted}/{monthElapsed} ({monthRate}%)
            </p>
          </div>
          <div className="mt-3">
            <ProgressBar value={monthCompleted} max={monthElapsed} />
          </div>
        </Card>
      )}

      {weeks.length > 0 && (
        <>
          <h2 className="px-1 pt-4 text-lg font-bold">Diário</h2>
          <p className="px-1 pb-1 text-sm text-ink-dim">
            Resumo por semana, pronto pra mandar no feedback.
          </p>
          {weeks.map((week, i) => (
            <WeekSummaryCard
              key={week.weekNumber}
              summary={week}
              text={formatWeekSummary(week)}
              defaultOpen={i === 0}
            />
          ))}
        </>
      )}
    </main>
  );
}
