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
    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 active:opacity-70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 rounded border-2 border-line-bright bg-transparent accent-ember"
      />
      <span className={checked ? "text-paper-faint line-through" : "text-paper"}>
        {label}
      </span>
    </label>
  );
}
