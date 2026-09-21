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
    <label className="flex items-center gap-3 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
      />
      <span className={checked ? "text-neutral-400 line-through" : "text-neutral-900"}>
        {label}
      </span>
    </label>
  );
}
