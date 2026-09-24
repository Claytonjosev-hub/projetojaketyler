import { Card } from "./Card";
import { getContent, getDailyLogRange } from "@/lib/db";
import { getDayPattern, getProgramDay, isDayComplete } from "@/lib/program";

const WEEKDAY_LABELS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function isoDateNDaysFrom(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export async function WeekView({
  userId,
  today,
  viewing,
}: {
  userId: string;
  today: string;
  viewing: string;
}) {
  const [program, weekPattern, workoutPlan, meals, supplements] = await Promise.all([
    getContent(userId, "program"),
    getContent(userId, "weekPattern"),
    getContent(userId, "workoutPlan"),
    getContent(userId, "meals"),
    getContent(userId, "supplements"),
  ]);

  const todayProgramDay = getProgramDay(today, program.startDate);
  const jsDay = new Date(`${today}T00:00:00Z`).getUTCDay();
  const todayDayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const weekStart = isoDateNDaysFrom(today, -todayDayOfWeek);

  const logs = await getDailyLogRange(userId, weekStart, isoDateNDaysFrom(weekStart, 6));

  const days = Array.from({ length: 7 }, (_, i) => i).map((i) => {
      const date = isoDateNDaysFrom(weekStart, i);
      const dailyLog = logs.get(date) ?? null;
      const pattern = getDayPattern(date, weekPattern, dailyLog);
      const complete = isDayComplete({ date, today, dailyLog, pattern, meals, supplements });
      const block = pattern.trainingBlock ? workoutPlan.blocks[pattern.trainingBlock] : null;
      return {
        date,
        label: WEEKDAY_LABELS[i],
        mark: block?.short ?? "–",
        complete,
        isViewing: date === viewing,
        isFuture: getProgramDay(date, program.startDate) > todayProgramDay,
      };
  });

  return (
    <Card className="px-2 py-3">
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <a key={day.date} href={`/?date=${day.date}`} className="flex flex-col items-center gap-2 py-1">
            <span className="text-[11px] font-medium text-ink-faint">{day.label}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${
                day.isViewing
                  ? "bg-ink text-surface"
                  : day.complete
                    ? "bg-done-soft text-done"
                    : day.isFuture
                      ? "text-ink-faint"
                      : "bg-canvas text-ink-dim"
              }`}
            >
              {day.mark}
            </span>
          </a>
        ))}
      </div>
    </Card>
  );
}
