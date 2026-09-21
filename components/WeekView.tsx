import { Card } from "./Card";
import { Chip } from "./Chip";
import { getContent, getDailyLog } from "@/lib/db";
import { getDayPattern, getProgramDay, getWeekNumber, isDayComplete } from "@/lib/program";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function isoDateNDaysFrom(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export async function WeekView({ today }: { today: string }) {
  const [program, weekPattern, meals, supplements] = await Promise.all([
    getContent("program"),
    getContent("weekPattern"),
    getContent("meals"),
    getContent("supplements"),
  ]);

  const todayProgramDay = getProgramDay(today, program.startDate);
  const jsDay = new Date(`${today}T00:00:00Z`).getUTCDay();
  const todayDayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const weekStart = isoDateNDaysFrom(today, -todayDayOfWeek);

  const days = await Promise.all(
    Array.from({ length: 7 }, (_, i) => i).map(async (i) => {
      const date = isoDateNDaysFrom(weekStart, i);
      const dailyLog = await getDailyLog(date);
      const pattern = getDayPattern(date, weekPattern, dailyLog);
      const complete = isDayComplete({ date, today, dailyLog, pattern, meals, supplements });
      const programDay = getProgramDay(date, program.startDate);
      return { date, label: WEEKDAY_LABELS[i], pattern, complete, isToday: date === today, programDay };
    }),
  );

  return (
    <Card>
      <p className="mb-3 font-display text-lg font-medium text-paper">
        Semana {getWeekNumber(todayProgramDay)}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <a
            key={day.date}
            href={day.isToday ? "/" : `/?date=${day.date}`}
            className="flex flex-col items-center gap-1.5 py-1"
          >
            <p className="text-[11px] text-paper-faint">{day.label}</p>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-semibold ${
                day.complete
                  ? "bg-moss text-ink"
                  : day.programDay > todayProgramDay
                    ? "bg-transparent text-paper-faint/50"
                    : "bg-ink-field text-paper-dim"
              } ${day.isToday ? "ring-2 ring-ember ring-offset-2 ring-offset-ink-raised" : ""}`}
            >
              {day.pattern.trainingBlock ?? "•"}
            </div>
          </a>
        ))}
      </div>
      {days.some((d) => !d.pattern.trainingBlock && d.pattern.activity) && (
        <div className="mt-3">
          <Chip label="letra = treino · ponto = dia de atividade" tone="muted" />
        </div>
      )}
    </Card>
  );
}
