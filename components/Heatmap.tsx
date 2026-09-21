export interface HeatmapDay {
  date: string;
  weekNumber: number;
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  status: "complete" | "incomplete" | "future";
}

export function Heatmap({ days, weeks }: { days: HeatmapDay[]; weeks: number }) {
  const weekNumbers = Array.from({ length: weeks }, (_, i) => i + 1);
  const colorFor = (status: HeatmapDay["status"]) =>
    status === "complete" ? "bg-done" : status === "incomplete" ? "bg-line-strong" : "bg-canvas";

  return (
    <div className="flex gap-1.5">
      {weekNumbers.map((week) => (
        <div key={week} className="flex flex-1 flex-col gap-1.5">
          {Array.from({ length: 7 }, (_, dow) => {
            const day = days.find((d) => d.weekNumber === week && d.dayOfWeek === dow);
            return (
              <div
                key={dow}
                title={day?.date}
                className={`aspect-square rounded ${day ? colorFor(day.status) : "bg-transparent"}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
