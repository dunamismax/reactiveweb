import { listDemoUsers, listRecentDemoActivity } from "@reactiveweb/db";
import { StatCard } from "~/components/stat-card";
import {
  ensureDemoSeeded,
  mapDbActivityToEvent,
  mapDbUserToDemoUser,
  requireAuthSession,
} from "~/lib/demo-state.server";
import type { Route } from "./+types/dashboard";

function asPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuthSession(request);
  await ensureDemoSeeded();

  const [users, activity] = await Promise.all([listDemoUsers(), listRecentDemoActivity(12)]);

  return {
    users: users.map(mapDbUserToDemoUser),
    activity: activity.map(mapDbActivityToEvent),
  };
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  const { users, activity } = loaderData;

  const activeUsers = users.filter((user) => user.status === "active").length;
  const suspendedUsers = users.length - activeUsers;
  const adoptionPercent = asPercent(activeUsers, users.length);

  const roleCounts = {
    owner: users.filter((user) => user.role === "owner").length,
    admin: users.filter((user) => user.role === "admin").length,
    editor: users.filter((user) => user.role === "editor").length,
    viewer: users.filter((user) => user.role === "viewer").length,
  };

  return (
    <section>
      <header className="border-b border-[var(--border)] pb-4">
        <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Command Center</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          ReactiveWeb Operations Dashboard
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] md:text-base">
          This demo route highlights live workspace metrics and server-backed data flows. Edit users
          and auth state in sibling routes and watch this panel refresh from Postgres.
        </p>
      </header>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Workspace Users"
          trend="Total managed accounts"
          value={String(users.length)}
        />
        <StatCard
          label="Active Accounts"
          tone="good"
          trend="Ready for access"
          value={String(activeUsers)}
        />
        <StatCard
          label="Suspended Accounts"
          tone="warn"
          trend="Require admin review"
          value={String(suspendedUsers)}
        />
        <StatCard label="Adoption" trend="Active user ratio" value={`${adoptionPercent}%`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Role Distribution</p>
          <div className="mt-4 grid gap-3">
            {Object.entries(roleCounts).map(([role, count]) => {
              const width = asPercent(count, users.length);
              return (
                <div key={role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize">{role}</span>
                    <span className="text-[var(--muted)]">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--track)]">
                    <div
                      className="h-2 rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.max(width, count ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Recent Activity</p>
          <ul className="mt-3 grid gap-3">
            {activity.slice(0, 5).map((event) => (
              <li
                className="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] p-3"
                key={event.id}
              >
                <p className="text-sm font-medium">
                  {event.actor} {event.action.toLowerCase()}
                </p>
                <p className="text-sm text-[var(--muted)]">{event.target}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
