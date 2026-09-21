export function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "muted";
}) {
  const toneClasses = {
    neutral: "border-line-bright bg-ink-field text-paper-dim",
    success: "border-moss/40 bg-moss-soft text-moss",
    muted: "border-transparent text-paper-faint",
  }[tone];
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${toneClasses}`}>
      {label}
    </span>
  );
}
