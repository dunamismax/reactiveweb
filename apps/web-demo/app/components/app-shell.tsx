import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigation } from "react-router";
import { Avatar } from "./avatar";
import { CommandPalette } from "./command-palette";

const mainNav = [
  { to: "/", label: "Command Center", end: true },
  { to: "/users", label: "User Management" },
  { to: "/activity", label: "Activity Log" },
];

const systemNav = [
  { to: "/auth", label: "Auth Lab" },
  { to: "/stack", label: "Stack Matrix" },
  { to: "/settings", label: "Settings" },
];

type AppShellProps = {
  currentUserName: string;
  userCount: number;
};

function navClass(isActive: boolean) {
  return [
    "nav-transition rounded-xl px-3 py-2 text-sm font-medium",
    isActive
      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
  ].join(" ");
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
const kbdHint = isMac ? "⌘K" : "Ctrl+K";

export function AppShell({ currentUserName, userCount }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1250px] gap-5 p-4 md:grid-cols-[260px_1fr] md:p-6">
      {/* Mobile header */}
      <div className="flex items-center justify-between md:hidden">
        <div>
          <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">ReactiveWeb</p>
          <p className="font-semibold">Web Demo</p>
        </div>
        <button
          className="nav-transition rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={`rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 md:flex md:flex-col md:p-5 ${
          mobileOpen ? "block" : "hidden md:flex"
        }`}
      >
        <div className="border-b border-[var(--border)] pb-4">
          <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">ReactiveWeb</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Web Demo</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            SPA-first UI with server-backed auth/data
          </p>
        </div>

        <nav className="mt-5 grid gap-1">
          <p className="mb-1 px-3 text-xs tracking-[0.15em] text-[var(--muted)] uppercase">Main</p>
          {mainNav.map((item) => (
            <NavLink
              className={({ isActive }) => navClass(isActive)}
              end={item.end}
              key={item.to}
              onClick={() => setMobileOpen(false)}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}

          <p className="mb-1 mt-4 px-3 text-xs tracking-[0.15em] text-[var(--muted)] uppercase">
            System
          </p>
          {systemNav.map((item) => (
            <NavLink
              className={({ isActive }) => navClass(isActive)}
              key={item.to}
              onClick={() => setMobileOpen(false)}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs text-[var(--muted)] uppercase">Active Session</p>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={currentUserName} size="sm" />
            <p className="font-medium leading-tight">{currentUserName}</p>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{userCount} users in workspace</p>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">ReactiveWeb v1.0</p>
            <button
              className="nav-transition flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              onClick={() => setPaletteOpen(true)}
              title="Open command palette"
              type="button"
            >
              {kbdHint}
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 md:p-6 ${
          isNavigating ? "route-transitioning" : "route-idle"
        }`}
      >
        <Outlet />
      </main>

      <CommandPalette onClose={() => setPaletteOpen(false)} open={paletteOpen} />
    </div>
  );
}
