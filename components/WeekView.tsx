import Link from "next/link";
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
      <p className="mb-2 font-medium">Semana {getWeekNumber(todayProgramDay)}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <Link key={day.date} href={day.isToday ? "/" : `/?date=${day.date}`} className="text-center">
            <p className="text-xs text-neutral-400">{day.label}</p>
            <div
              className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                day.complete
                  ? "bg-emerald-500 text-white"
                  : day.programDay > todayProgramDay
                    ? "bg-neutral-100 text-neutral-300"
                    : "bg-neutral-200 text-neutral-600"
              } ${day.isToday ? "ring-2 ring-neutral-900 ring-offset-1" : ""}`}
            >
              {day.pattern.trainingBlock ?? "•"}
            </div>
          </Link>
        ))}
      </div>
      {days.some((d) => !d.pattern.trainingBlock && d.pattern.activity) && (
        <div className="mt-2">
          <Chip label="Legenda: letra = bloco de treino, • = dia de atividade" tone="muted" />
        </div>
      )}
    </Card>
  );
}
