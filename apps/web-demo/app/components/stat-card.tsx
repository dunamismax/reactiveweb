import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  tone?: "default" | "good" | "warn";
  icon?: ReactNode;
};

const toneClasses = {
  default: "bg-[var(--surface)] text-[var(--foreground)]",
  good: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warn: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function StatCard({ label, value, trend, tone = "default", icon }: StatCardProps) {
  return (
    <article className="card-hover rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon ? (
          <div
            className={`inline-flex size-9 items-center justify-center rounded-lg border ${toneClasses[tone]}`}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">{trend}</p>
    </article>
  );
}
