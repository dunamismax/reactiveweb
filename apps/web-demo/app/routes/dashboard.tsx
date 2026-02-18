import { StatCard } from "~/components/stat-card";
import { useDemoStore } from "~/lib/demo-store";

function asPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export default function DashboardRoute() {
  const {
    state: { users, activity },
  } = useDemoStore();

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
          This demo route highlights live workspace metrics and typed state-driven UI. Edit users
          and auth state in sibling routes and watch this panel update instantly.
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
                  <div className="h-2 rounded-full bg-black/25">
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
                className="rounded-lg border border-[var(--border)] bg-black/15 p-3"
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
