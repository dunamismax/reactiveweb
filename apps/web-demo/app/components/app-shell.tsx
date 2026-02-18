import { NavLink, Outlet } from "react-router";

const navItems = [
  { to: "/", label: "Command Center", end: true },
  { to: "/users", label: "User Management" },
  { to: "/auth", label: "Auth Lab" },
  { to: "/stack", label: "Stack Matrix" },
];

type AppShellProps = {
  currentUserName: string;
  userCount: number;
};

function navClass(isActive: boolean) {
  return [
    "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
  ].join(" ");
}

export function AppShell({ currentUserName, userCount }: AppShellProps) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1250px] gap-5 p-4 md:grid-cols-[260px_1fr] md:p-6">
      <aside className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 md:p-5">
        <div className="border-b border-[var(--border)] pb-4">
          <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">ReactiveWeb</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Web Demo</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            SPA-first UI with server-backed auth/data
          </p>
        </div>

        <nav className="mt-5 grid gap-2">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => navClass(isActive)}
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs text-[var(--muted)] uppercase">Active Session</p>
          <p className="mt-1 font-medium">{currentUserName}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{userCount} users in workspace</p>
        </div>
      </aside>

      <main className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
