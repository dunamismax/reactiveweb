import type { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function InputField({ label, error, id, ...props }: InputFieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="grid gap-1 text-sm" htmlFor={inputId}>
      <span className="text-[var(--muted)]">{label}</span>
      <input
        className="rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-2 outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        id={inputId}
        {...props}
      />
      {error ? <span className="text-xs text-[var(--tone-warn-fg)]">{error}</span> : null}
    </label>
  );
}
