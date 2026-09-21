export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 active:opacity-60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 rounded-md border-2 border-line-strong accent-done"
      />
      <span className={checked ? "text-ink-faint line-through" : "text-ink"}>{label}</span>
    </label>
  );
}
