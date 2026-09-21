export function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "muted";
}) {
  const toneClasses = {
    neutral: "bg-canvas text-ink-dim",
    success: "bg-done-soft text-done",
    muted: "text-ink-faint",
  }[tone];
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses}`}>
      {label}
    </span>
  );
}
