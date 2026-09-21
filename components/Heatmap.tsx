import { Chip } from "./Chip";

export interface HeatmapDay {
  date: string;
  weekNumber: number;
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  status: "complete" | "incomplete" | "future";
}

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);
  const colorFor = (status: HeatmapDay["status"]) =>
    status === "complete" ? "bg-emerald-500" : status === "incomplete" ? "bg-neutral-300" : "bg-neutral-100";

  return (
    <div>
      <div className="flex gap-1.5">
        {weeks.map((week) => (
          <div key={week} className="flex flex-col gap-1.5">
            {Array.from({ length: 7 }, (_, dow) => {
              const day = days.find((d) => d.weekNumber === week && d.dayOfWeek === dow);
              return (
                <div
                  key={dow}
                  title={day?.date}
                  className={`h-3.5 w-3.5 rounded-sm ${day ? colorFor(day.status) : "bg-transparent"}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Chip label="Completo" tone="success" />
        <Chip label="Incompleto" tone="neutral" />
        <Chip label="Futuro" tone="muted" />
      </div>
    </div>
  );
}
