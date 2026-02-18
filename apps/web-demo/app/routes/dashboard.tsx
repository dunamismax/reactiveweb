import { listDemoUsers, listRecentDemoActivity } from "@reactiveweb/db";
import { Link, useNavigation } from "react-router";
import { EmptyState } from "~/components/empty-state";
import { SectionHeader } from "~/components/section-header";
import { Skeleton } from "~/components/skeleton";
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

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatActivityTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuthSession(request);
  await ensureDemoSeeded();

  const [users, activity] = await Promise.all([listDemoUsers(), listRecentDemoActivity(12)]);

  return {
    currentUserName: session.user.name,
    users: users.map(mapDbUserToDemoUser),
    activity: activity.map(mapDbActivityToEvent),
  };
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  const { currentUserName, users, activity } = loaderData;
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const activeUsers = users.filter((user) => user.status === "active").length;
  const suspendedUsers = users.length - activeUsers;
  const adoptionPercent = asPercent(activeUsers, users.length);

  const roleCounts = {
    owner: users.filter((user) => user.role === "owner").length,
    admin: users.filter((user) => user.role === "admin").length,
    editor: users.filter((user) => user.role === "editor").length,
    viewer: users.filter((user) => user.role === "viewer").length,
  };

  const greeting = greetingForHour(new Date().getHours());

  return (
    <section>
      <SectionHeader
        caption="Command Center"
        description="Live workspace metrics backed by Postgres. Edit users and auth state in sibling routes and watch this panel refresh."
        title={`${greeting}, ${currentUserName.split(" ")[0]}`}
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              key={i}
            >
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="mb-3 h-9 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))
        ) : (
          <>
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
              label="Suspended"
              tone="warn"
              trend="Require admin review"
              value={String(suspendedUsers)}
            />
            <StatCard label="Adoption" trend="Active user ratio" value={`${adoptionPercent}%`} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Role Distribution</p>
          <div className="mt-4 grid gap-3">
            {Object.entries(roleCounts).map(([role, count]) => {
              const width = asPercent(count, users.length);
              const barColors: Record<string, string> = {
                owner: "bg-amber-400",
                admin: "bg-violet-400",
                editor: "bg-sky-400",
                viewer: "bg-[var(--muted)]",
              };
              return (
                <div key={role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize">{role}</span>
                    <span className="text-[var(--muted)]">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--track)]">
                    <div
                      className={`progress-fill h-2 rounded-full ${barColors[role] ?? "bg-[var(--accent)]"}`}
                      style={{ width: `${Math.max(width, count ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">Recent Activity</p>
            <Link className="text-xs text-[var(--accent)] hover:underline" to="/activity">
              View all
            </Link>
          </div>
          {isLoading ? (
            <ul className="mt-3 grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li
                  className="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] p-3"
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                  key={i}
                >
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </li>
              ))}
            </ul>
          ) : activity.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                description="Activity will appear here as users are managed."
                title="No activity yet"
              />
            </div>
          ) : (
            <ul className="mt-3 grid gap-3">
              {activity.slice(0, 5).map((event) => (
                <li
                  className="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] p-3"
                  key={event.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">
                      {event.actor} {event.action.toLowerCase()}
                    </p>
                    <time className="shrink-0 text-xs text-[var(--muted)]">
                      {formatActivityTime(event.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{event.target}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link
          className="card-hover rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
          to="/users"
        >
          <p className="font-medium">User Management</p>
          <p className="mt-1 text-[var(--muted)]">Invite and manage workspace members</p>
        </Link>
        <Link
          className="card-hover rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
          to="/activity"
        >
          <p className="font-medium">Activity Log</p>
          <p className="mt-1 text-[var(--muted)]">Browse the full audit trail</p>
        </Link>
        <Link
          className="card-hover rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
          to="/stack"
        >
          <p className="font-medium">Stack Matrix</p>
          <p className="mt-1 text-[var(--muted)]">View technology stack contract</p>
        </Link>
      </div>
    </section>
  );
}
