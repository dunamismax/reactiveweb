import { appProjects, demoAuditLogs, demoInvites, demoUsers } from "@reactiveweb/db/schema";
import { getTableName } from "drizzle-orm";
import { DataList } from "~/components/data-list";
import { SectionHeader } from "~/components/section-header";
import { StackChip } from "~/components/stack-chip";
import { requireAuthSession } from "~/lib/demo-state.server";
import { demoEnv } from "~/lib/env";
import { demoServerEnv } from "~/lib/env.server";
import type { Route } from "./+types/stack";

const stackRows = [
  {
    label: "Runtime",
    detail: "Node.js 24.13.1+ and pnpm run workspace scripts, app tasks, and package installs.",
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
    detail: "Zod validates env config and server payloads at trust boundaries.",
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

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuthSession(request);
  return {
    dbConfigured: Boolean(demoServerEnv.DATABASE_URL),
  };
}

export default function StackRoute({ loaderData }: Route.ComponentProps) {
  const tableNames = [
    getTableName(appProjects),
    getTableName(demoUsers),
    getTableName(demoAuditLogs),
    getTableName(demoInvites),
  ];

  return (
    <section>
      <SectionHeader
        caption="Stack Matrix"
        description="Flagship example of the ReactiveWeb stack contract and shared package usage."
        title="Technology Coverage"
      />

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
                className="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] px-3 py-2 font-mono"
                key={tableName}
              >
                {tableName}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Validated Demo Env</p>
          <div className="mt-3">
            <DataList
              items={[
                { label: "App Name", value: demoEnv.VITE_APP_NAME },
                { label: "Auth Demo Enabled", value: String(demoEnv.VITE_ENABLE_AUTH_DEMO) },
                { label: "NODE_ENV", value: demoEnv.NODE_ENV },
                {
                  label: "DATABASE_URL",
                  value: loaderData.dbConfigured ? "configured" : "not set",
                },
              ]}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
