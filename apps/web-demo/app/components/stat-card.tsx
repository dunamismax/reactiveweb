import type { ReactNode } from "react";
import { type StatTone, statToneClasses } from "~/lib/semantic-styles";

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  tone?: StatTone;
  icon?: ReactNode;
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
            className={`inline-flex size-9 items-center justify-center rounded-lg border ${statToneClasses[tone]}`}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">{trend}</p>
    </article>
  );
}
