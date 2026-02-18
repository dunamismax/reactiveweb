import {
  createDemoUser,
  getDemoUserById,
  listDemoUsers,
  updateDemoUserRole,
  updateDemoUserStatus,
} from "@reactiveweb/db";
import { Button } from "@reactiveweb/ui";
import { useEffect, useState } from "react";
import { Form, useNavigation } from "react-router";
import { assertCanCreateUser, assertCanMutateUser } from "~/lib/authorization.server";
import {
  mapDbUserToDemoUser,
  nextRole,
  recordAuditEvent,
  requireAuthSession,
} from "~/lib/demo-state.server";
import { demoServerEnv } from "~/lib/env.server";
import { createUserInputSchema, type Role, toRole, usersActionSchema } from "~/lib/models";
import { hashBootstrapPassword } from "~/lib/password.server";
import { errorPayload } from "~/lib/server-responses";
import type { Route } from "./+types/users";

const roleOptions: Role[] = ["viewer", "editor", "admin", "owner"];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuthSession(request);
  const users = await listDemoUsers();

  return {
    users: users.map(mapDbUserToDemoUser),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuthSession(request);
  const formData = await request.formData();
  const rawInput = Object.fromEntries(formData.entries());
  const parsed = usersActionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return errorPayload(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid request payload.",
    );
  }

  if (parsed.data.intent === "createUser") {
    const parsedUser = createUserInputSchema.safeParse(parsed.data);
    if (!parsedUser.success) {
      return errorPayload(
        "BAD_REQUEST",
        parsedUser.error.issues[0]?.message ?? "Invalid user payload.",
      );
    }

    assertCanCreateUser(session.user, parsedUser.data.role);

    const created = await createDemoUser({
      ...parsedUser.data,
      passwordHash: hashBootstrapPassword(demoServerEnv.AUTH_DEMO_PASSWORD),
    });
    if (!created) {
      return errorPayload("BAD_REQUEST", "A user with this email already exists.");
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: "Created",
      target: `user ${created.email}`,
      details: `${session.user.name} created ${created.email}`,
    });

    return { ok: true, message: "User created successfully.", intent: "createUser" as const };
  }

  const current = await getDemoUserById(parsed.data.userId);
  if (!current) {
    return errorPayload("NOT_FOUND", "User not found.");
  }

  assertCanMutateUser(
    session.user,
    { id: current.id, role: toRole(current.role) },
    parsed.data.intent,
  );

  if (parsed.data.intent === "cycleRole") {
    const role = nextRole(toRole(current.role));

    if (session.user.role === "admin" && (role === "owner" || role === "admin")) {
      return errorPayload("FORBIDDEN", "Admin accounts can only assign viewer/editor roles.");
    }

    await updateDemoUserRole({ userId: parsed.data.userId, role });

    await recordAuditEvent({
      actorId: session.user.id,
      action: "Updated",
      target: `${current.email} role`,
      details: `${session.user.name} changed role to ${role}`,
    });

    return { ok: true, message: "Role updated.", intent: "cycleRole" as const };
  }

  const nextActive = !current.active;
  await updateDemoUserStatus({ userId: parsed.data.userId, active: nextActive });

  await recordAuditEvent({
    actorId: session.user.id,
    action: nextActive ? "Activated" : "Suspended",
    target: current.email,
    details: `${session.user.name} set status to ${nextActive ? "active" : "suspended"}`,
  });

  return { ok: true, message: "Status updated.", intent: "toggleStatus" as const };
}

export default function UsersRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { users } = loaderData;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const feedback =
    actionData && "error" in actionData ? actionData.error.message : (actionData?.message ?? null);

  useEffect(() => {
    if (actionData?.ok && actionData.intent === "createUser") {
      setName("");
      setEmail("");
      setRole("viewer");
    }
  }, [actionData]);

  return (
    <section>
      <header className="border-b border-[var(--border)] pb-4">
        <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">User Management</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Team Access Controls</h2>
        <p className="mt-2 text-sm text-[var(--muted)] md:text-base">
          Server-side validation and authorization are enforced for every mutation.
        </p>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Invite User</p>
          <Form className="mt-3 grid gap-3" method="post">
            <input name="intent" type="hidden" value="createUser" />
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Name</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Jordan Lee"
                value={name}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Email</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jordan@reactiveweb.dev"
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Role</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                name="role"
                onChange={(event) => setRole(event.target.value as Role)}
                value={role}
              >
                {roleOptions.map((option) => (
                  <option className="bg-[var(--panel)]" key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <Button disabled={isSubmitting} type="submit">
              Create Account
            </Button>
          </Form>

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
                    <Form method="post">
                      <input name="intent" type="hidden" value="cycleRole" />
                      <input name="userId" type="hidden" value={user.id} />
                      <button
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs capitalize"
                        type="submit"
                      >
                        {user.role}
                      </button>
                    </Form>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Form method="post">
                      <input name="intent" type="hidden" value="toggleStatus" />
                      <input name="userId" type="hidden" value={user.id} />
                      <button
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs capitalize"
                        type="submit"
                      >
                        {user.status}
                      </button>
                    </Form>
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
