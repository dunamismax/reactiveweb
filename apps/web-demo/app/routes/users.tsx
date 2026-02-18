import { Button } from "@reactiveweb/ui";
import { type FormEvent, useState } from "react";

import { useDemoStore } from "~/lib/demo-store";
import type { Role } from "~/lib/models";

const roleOptions: Role[] = ["viewer", "editor", "admin", "owner"];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function UsersRoute() {
  const {
    state: { users },
    addUser,
    cycleRole,
    setStatus,
  } = useDemoStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = addUser({ name, email, role });
    if (!result.ok) {
      setFeedback(result.error ?? "Unable to create user.");
      return;
    }

    setFeedback("User created successfully.");
    setName("");
    setEmail("");
    setRole("viewer");
  }

  return (
    <section>
      <header className="border-b border-[var(--border)] pb-4">
        <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">User Management</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Team Access Controls</h2>
        <p className="mt-2 text-sm text-[var(--muted)] md:text-base">
          Form validation is powered by Zod schemas, and changes flow through typed application
          state.
        </p>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Invite User</p>
          <form className="mt-3 grid gap-3" onSubmit={handleAddUser}>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Name</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 outline-none focus:border-[var(--accent)]"
                onChange={(event) => setName(event.target.value)}
                placeholder="Jordan Lee"
                value={name}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Email</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 outline-none focus:border-[var(--accent)]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jordan@reactiveweb.dev"
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Role</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 outline-none focus:border-[var(--accent)]"
                onChange={(event) => setRole(event.target.value as Role)}
                value={role}
              >
                {roleOptions.map((option) => (
                  <option className="bg-[#0f2f2c]" key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Create Account</Button>
          </form>

          {feedback ? <p className="mt-3 text-sm text-[var(--muted)]">{feedback}</p> : null}
        </article>

        <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Seen</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-b border-[var(--border)]" key={user.id}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-[var(--muted)]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs capitalize"
                      onClick={() => cycleRole(user.id)}
                      type="button"
                    >
                      {user.role}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs capitalize"
                      onClick={() =>
                        setStatus(user.id, user.status === "active" ? "suspended" : "active")
                      }
                      type="button"
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--muted)]">
                    {formatTimestamp(user.lastSeenAt)}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-[var(--muted)]">
                    Created {formatTimestamp(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
