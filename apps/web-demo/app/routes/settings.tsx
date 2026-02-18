import { getDemoUserCount, listDemoUsers } from "@reactiveweb/db";
import { DataList } from "~/components/data-list";
import { SectionHeader } from "~/components/section-header";
import { ensureDemoSeeded, requireAuthSession } from "~/lib/demo-state.server";
import { demoEnv } from "~/lib/env";
import { demoServerEnv } from "~/lib/env.server";
import type { Route } from "./+types/settings";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuthSession(request);
  await ensureDemoSeeded();

  const [userCount, users] = await Promise.all([getDemoUserCount(), listDemoUsers()]);

  const roleSummary = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const activeCount = users.filter((u) => u.active).length;

  return {
    currentUser: session.user,
    userCount,
    activeCount,
    roleSummary,
    dbConfigured: Boolean(demoServerEnv.DATABASE_URL),
  };
}

export default function SettingsRoute({ loaderData }: Route.ComponentProps) {
  const { currentUser, userCount, activeCount, roleSummary, dbConfigured } = loaderData;

  return (
    <section>
      <SectionHeader
        caption="Settings"
        description="Workspace configuration and environment overview. Read-only showcase of the validated config layer."
        title="Workspace Settings"
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Current Session</p>
          <div className="mt-3">
            <DataList
              items={[
                { label: "Name", value: currentUser.name },
                { label: "Role", value: currentUser.role },
                { label: "User ID", value: `${currentUser.id.slice(0, 8)}...` },
              ]}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Workspace Overview</p>
          <div className="mt-3">
            <DataList
              items={[
                { label: "Total Users", value: String(userCount) },
                { label: "Active Users", value: String(activeCount) },
                {
                  label: "Role Breakdown",
                  value: Object.entries(roleSummary)
                    .map(([role, count]) => `${count} ${role}`)
                    .join(", "),
                },
              ]}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Application Config</p>
          <div className="mt-3">
            <DataList
              items={[
                { label: "App Name", value: demoEnv.VITE_APP_NAME },
                { label: "Environment", value: demoEnv.NODE_ENV },
                { label: "Auth Demo", value: String(demoEnv.VITE_ENABLE_AUTH_DEMO) },
                { label: "Database", value: dbConfigured ? "connected" : "not configured" },
              ]}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Stack Contract</p>
          <div className="mt-3">
            <DataList
              items={[
                { label: "Runtime", value: "Bun" },
                { label: "Framework", value: "Vite + React Router" },
                { label: "UI", value: "Tailwind CSS + shadcn patterns" },
                { label: "ORM", value: "Drizzle" },
                { label: "Validation", value: "Zod" },
                { label: "Auth", value: "Auth.js" },
              ]}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
