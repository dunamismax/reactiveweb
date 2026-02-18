type StackChipProps = {
  label: string;
  detail: string;
};

export function StackChip({ label, detail }: StackChipProps) {
  return (
    <article className="card-hover rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">{label}</p>
      <p className="mt-2 text-sm leading-relaxed">{detail}</p>
    </article>
  );
}
