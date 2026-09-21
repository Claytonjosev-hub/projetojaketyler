import { Heatmap, type HeatmapDay } from "@/components/Heatmap";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { getContent, getDailyLog } from "@/lib/db";
import { getDayPattern, getProgramDay, getWeekNumber, isDayComplete, todayIso } from "@/lib/program";

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
  let completedCount = 0;
  let elapsedCount = 0;
  let currentStreak = 0;

  for (let offset = 0; offset < totalDays; offset++) {
    const date = isoDateNDaysFrom(program.startDate, offset);
    const programDay = getProgramDay(date, program.startDate);
    const weekNumber = getWeekNumber(programDay);
    const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
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
    <main className="space-y-4 p-4 pt-6">
      <h1 className="font-display text-3xl font-semibold leading-none text-paper">Progresso</h1>

      <Card>
        <Heatmap days={days} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-ink-raised p-3">
          <p className="text-xs text-paper-faint">Dias completos</p>
          <p className="mb-2 font-display text-2xl font-semibold text-paper">
            {completedCount}/{elapsedCount} <span className="text-base text-paper-dim">({completionRate}%)</span>
          </p>
          <ProgressBar value={completedCount} max={elapsedCount || 1} />
        </div>
        <div className="rounded-lg border border-line bg-ink-raised p-3">
          <p className="text-xs text-paper-faint">Sequência atual</p>
          <p className="font-display text-2xl font-semibold text-paper">
            {currentStreak} <span className="text-base text-paper-dim">{currentStreak === 1 ? "dia" : "dias"}</span>
          </p>
        </div>
      </div>

      {monthElapsed > 0 && (
        <div className="rounded-lg border border-line bg-ink-raised p-3">
          <p className="text-xs text-paper-faint">{monthLabel}</p>
          <p className="mb-2 font-display text-2xl font-semibold text-paper">
            {monthCompleted}/{monthElapsed} <span className="text-base text-paper-dim">({monthRate}%)</span>
          </p>
          <ProgressBar value={monthCompleted} max={monthElapsed} />
        </div>
      )}
    </main>
  );
}
