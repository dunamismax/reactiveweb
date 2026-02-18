import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
};

export function SelectField({ label, options, id, ...props }: SelectFieldProps) {
  const selectId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="grid gap-1 text-sm" htmlFor={selectId}>
      <span className="text-[var(--muted)]">{label}</span>
      <select
        className="rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-2 outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--focus-ring)]"
        id={selectId}
        {...props}
      >
        {options.map((opt) => (
          <option className="bg-[var(--panel)]" key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
