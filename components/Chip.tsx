export function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "muted";
}) {
  const toneClasses = {
    neutral: "bg-neutral-100 text-neutral-700",
    success: "bg-emerald-100 text-emerald-800",
    muted: "bg-neutral-50 text-neutral-400",
  }[tone];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses}`}>
      {label}
    </span>
  );
}
