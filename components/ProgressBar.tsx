export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const complete = pct === 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className={`h-full rounded-full transition-all duration-300 ${complete ? "bg-done" : "bg-ink"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
