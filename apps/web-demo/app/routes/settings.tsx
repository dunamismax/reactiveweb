import { getDemoUserById, updateDemoUserName, updateDemoUserPassword } from "@reactiveweb/db";
import { Button } from "@reactiveweb/ui";
import { useEffect, useMemo, useState } from "react";
import { Form, useNavigation, useSearchParams } from "react-router";
import { DataList } from "~/components/data-list";
import { InputField } from "~/components/input";
import { SectionHeader } from "~/components/section-header";
import { useToast } from "~/components/toast";
import { recordAuditEvent, requireAuthSession } from "~/lib/demo-state.server";
import { settingsActionSchema } from "~/lib/models";
import { hashPassword, verifyPassword } from "~/lib/password.server";
import { errorPayload, throwRouteError } from "~/lib/server-responses";
import type { Route } from "./+types/settings";

function formatTimestamp(value: Date | string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuthSession(request);
  const dbUser = await getDemoUserById(session.user.id);

  if (!dbUser) {
    throwRouteError(401, "UNAUTHORIZED", "Session user no longer exists.");
  }

  return {
    profile: {
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      mustChangePassword: dbUser.mustChangePassword,
      role: dbUser.role,
      lastSeenAt: dbUser.lastSeenAt ? dbUser.lastSeenAt.toISOString() : null,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuthSession(request);
  const dbUser = await getDemoUserById(session.user.id);

  if (!dbUser) {
    return errorPayload("UNAUTHORIZED", "Session user no longer exists.");
  }

  const formData = await request.formData();
  const rawInput = Object.fromEntries(formData.entries());
  const parsed = settingsActionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return errorPayload(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid settings payload.",
    );
  }

  if (parsed.data.intent === "updateProfile") {
    const updated = await updateDemoUserName({
      userId: session.user.id,
      name: parsed.data.name,
    });

    if (!updated) {
      return errorPayload("NOT_FOUND", "User account not found.");
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: "Updated",
      target: `${dbUser.username} profile`,
      details: `${session.user.username} changed display name to ${parsed.data.name}`,
    });

    return {
      ok: true,
      intent: "updateProfile" as const,
      message: "Profile updated.",
    };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return errorPayload("BAD_REQUEST", "New password confirmation does not match.");
  }

  if (!dbUser.passwordHash || !verifyPassword(parsed.data.currentPassword, dbUser.passwordHash)) {
    return errorPayload("FORBIDDEN", "Current password is incorrect.");
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return errorPayload("BAD_REQUEST", "New password must be different from current password.");
  }

  const updatedPassword = await updateDemoUserPassword({
    userId: session.user.id,
    passwordHash: hashPassword(parsed.data.newPassword),
    mustChangePassword: false,
  });

  if (!updatedPassword) {
    return errorPayload("NOT_FOUND", "User account not found.");
  }

  await recordAuditEvent({
    actorId: session.user.id,
    action: "Updated",
    target: `${dbUser.username} password`,
    details: `${session.user.username} changed account password`,
  });

  return {
    ok: true,
    intent: "changePassword" as const,
    message: "Password updated.",
  };
}

export default function SettingsRoute({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState(loaderData.profile.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setName(loaderData.profile.name);
  }, [loaderData.profile.name]);

  useEffect(() => {
    if (!actionData) return;

    if ("ok" in actionData && actionData.ok) {
      addToast(actionData.message, "success");
      if (actionData.intent === "changePassword") {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
      return;
    }

    if ("error" in actionData) {
      addToast(actionData.error.message, "error");
    }
  }, [actionData, addToast]);

  const optimisticName = useMemo(() => {
    if (
      navigation.state === "submitting" &&
      navigation.formData?.get("intent") === "updateProfile" &&
      typeof navigation.formData?.get("name") === "string"
    ) {
      return String(navigation.formData.get("name"));
    }

    return loaderData.profile.name;
  }, [navigation.formData, navigation.state, loaderData.profile.name]);

  const isSubmittingProfile =
    navigation.state === "submitting" && navigation.formData?.get("intent") === "updateProfile";

  const isSubmittingPassword =
    navigation.state === "submitting" && navigation.formData?.get("intent") === "changePassword";

  const forcedByGuard = searchParams.get("required") === "password-change";

  return (
    <section>
      <SectionHeader
        caption="Settings"
        description="Manage your profile details and account credentials."
        title="User Settings"
      />

      {loaderData.profile.mustChangePassword || forcedByGuard ? (
        <div className="mt-4 rounded-xl border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] p-4 text-sm text-[var(--tone-warning-fg)]">
          Your password must be changed before you can access other routes.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Profile</p>
          <div className="mt-3">
            <DataList
              items={[
                { label: "Name", value: optimisticName },
                { label: "Username", value: loaderData.profile.username },
                { label: "Role", value: loaderData.profile.role },
                { label: "Last Seen", value: formatTimestamp(loaderData.profile.lastSeenAt) },
              ]}
            />
          </div>

          <Form className="mt-4 grid gap-3" method="post">
            <input name="intent" type="hidden" value="updateProfile" />
            <InputField
              label="Display Name"
              name="name"
              onChange={(event) => setName((event.target as HTMLInputElement).value)}
              required
              value={name}
            />
            <Button disabled={isSubmittingProfile} type="submit">
              Save Name
            </Button>
          </Form>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Password</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Change your account password. Minimum length is 8 characters.
          </p>

          <Form className="mt-4 grid gap-3" method="post">
            <input name="intent" type="hidden" value="changePassword" />
            <InputField
              autoComplete="current-password"
              label="Current Password"
              name="currentPassword"
              onChange={(event) => setCurrentPassword((event.target as HTMLInputElement).value)}
              required
              type="password"
              value={currentPassword}
            />
            <InputField
              autoComplete="new-password"
              label="New Password"
              minLength={8}
              name="newPassword"
              onChange={(event) => setNewPassword((event.target as HTMLInputElement).value)}
              required
              type="password"
              value={newPassword}
            />
            <InputField
              autoComplete="new-password"
              label="Confirm Password"
              minLength={8}
              name="confirmPassword"
              onChange={(event) => setConfirmPassword((event.target as HTMLInputElement).value)}
              required
              type="password"
              value={confirmPassword}
            />
            <Button disabled={isSubmittingPassword} type="submit">
              Update Password
            </Button>
          </Form>
        </article>
      </div>
    </section>
  );
}
