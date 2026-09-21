export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className="h-full rounded-full bg-neutral-900 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
