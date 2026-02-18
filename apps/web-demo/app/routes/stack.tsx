import { appProjects, demoAuditLogs, demoUsers } from "@reactiveweb/db/schema";
import { getTableName } from "drizzle-orm";

import { StackChip } from "~/components/stack-chip";
import { demoEnv } from "~/lib/env";

const stackRows = [
  {
    label: "Runtime",
    detail: "Bun runs the workspace scripts, app tasks, and package installs.",
  },
  {
    label: "Frontend",
    detail: "Vite + React Router framework mode, configured for SPA-first navigation.",
  },
  {
    label: "UI",
    detail: "Tailwind utility styling with shadcn-style component patterns.",
  },
  {
    label: "Validation",
    detail: "Zod validates env config and form payloads before state updates.",
  },
  {
    label: "Auth",
    detail: "Auth.js typed config lives in app domain modules and drives auth workflows.",
  },
  {
    label: "Data",
    detail: "Drizzle ORM table contracts model Postgres entities with strong typing.",
  },
];

export default function StackRoute() {
  const tableNames = [
    getTableName(appProjects),
    getTableName(demoUsers),
    getTableName(demoAuditLogs),
  ];

  return (
    <section>
      <header className="border-b border-[var(--border)] pb-4">
        <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Stack Matrix</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Technology Coverage</h2>
        <p className="mt-2 text-sm text-[var(--muted)] md:text-base">
          This app is the flagship example of the ReactiveWeb stack contract and shared package
          usage.
        </p>
      </header>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stackRows.map((row) => (
          <StackChip detail={row.detail} key={row.label} label={row.label} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Drizzle/Postgres Contract</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Shared schema tables exported from `@reactiveweb/db/schema`:
          </p>
          <ul className="mt-3 grid gap-2 text-sm">
            {tableNames.map((tableName) => (
              <li
                className="rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2 font-mono"
                key={tableName}
              >
                {tableName}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Validated Demo Env</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">App Name</dt>
              <dd>{demoEnv.VITE_APP_NAME}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Auth Demo Enabled</dt>
              <dd>{String(demoEnv.VITE_ENABLE_AUTH_DEMO)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">NODE_ENV</dt>
              <dd>{demoEnv.NODE_ENV}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--muted)]">DATABASE_URL</dt>
              <dd>{demoEnv.DATABASE_URL ? "configured" : "not set"}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
