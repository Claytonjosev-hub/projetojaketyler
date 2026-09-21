import { Heatmap, type HeatmapDay } from "@/components/Heatmap";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { getContent, getDailyLog } from "@/lib/db";
import { getDayPattern, getProgramDay, getWeekNumber, isDayComplete } from "@/lib/program";

export const dynamic = "force-dynamic";

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
