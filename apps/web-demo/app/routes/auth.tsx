import { Button } from "@reactiveweb/ui";
import { useMemo, useState } from "react";
import { Form, useNavigation, useSearchParams } from "react-router";
import { forwardSignIn, forwardSignOut, getAuthSession } from "~/lib/auth.server";

import { demoAuthUiConfig, sanitizeCallbackPath, validateSignInPayload } from "~/lib/auth-config";
import { ensureDemoSeeded } from "~/lib/demo-state.server";
import { demoServerEnv } from "~/lib/env.server";
import { authActionSchema } from "~/lib/models";
import { errorPayload } from "~/lib/server-responses";
import type { Route } from "./+types/auth";

export async function loader({ request }: Route.LoaderArgs) {
  await ensureDemoSeeded();
  const session = await getAuthSession(request);

  return {
    authenticatedUserId: session?.user?.id ?? null,
    currentUserName: session?.user?.name ?? "Visitor Session",
    adminEmail: demoServerEnv.VITE_DEMO_ADMIN_EMAIL,
    authEnabled: true,
    sessionStrategy: demoAuthUiConfig.sessionStrategy,
    signInRoute: demoAuthUiConfig.signInRoute,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const input = Object.fromEntries(formData.entries());
  const parsed = authActionSchema.safeParse(input);

  if (!parsed.success) {
    return errorPayload("BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid auth payload.");
  }

  if (parsed.data.intent === "signIn") {
    const validated = validateSignInPayload(parsed.data);
    if (!validated.success) {
      return errorPayload("BAD_REQUEST", validated.error.issues[0]?.message ?? "Sign-in failed.");
    }

    return forwardSignIn(
      request,
      validated.data.email,
      validated.data.password,
      sanitizeCallbackPath(formData.get("callbackUrl"), demoAuthUiConfig.signInCallbackPath),
    );
  }

  return forwardSignOut(
    request,
    sanitizeCallbackPath(formData.get("callbackUrl"), demoAuthUiConfig.signOutCallbackPath),
  );
}

export default function AuthRoute({ loaderData, actionData }: Route.ComponentProps) {
  const {
    authenticatedUserId,
    currentUserName,
    adminEmail,
    authEnabled,
    sessionStrategy,
    signInRoute,
  } = loaderData;

  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const feedback = useMemo(() => {
    if (actionData && !actionData.ok) {
      return actionData.error.message ?? "Auth request failed.";
    }

    const status = searchParams.get("status");
    const error = searchParams.get("error");

    if (error) {
      return "Sign-in failed. Check your credentials and try again.";
    }

    if (status === "signed-in") {
      return "Session established.";
    }

    if (status === "signed-out") {
      return "Session cleared.";
    }

    return null;
  }, [actionData, searchParams]);

  return (
    <section>
      <header className="border-b border-[var(--border)] pb-4">
        <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Auth Lab</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Auth.js Integration Surface</h2>
        <p className="mt-2 text-sm text-[var(--muted)] md:text-base">
          Demonstrates typed Auth.js configuration, credential validation, and session-aware UI.
        </p>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Credentials Demo</p>
          <Form className="mt-3 grid gap-3" method="post">
            <input name="intent" type="hidden" value="signIn" />
            <input name="callbackUrl" type="hidden" value={demoAuthUiConfig.signInCallbackPath} />
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Email</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Password</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            <Button disabled={isSubmitting} type="submit">
              Sign In
            </Button>
          </Form>
          <Form className="mt-2" method="post">
            <input name="intent" type="hidden" value="signOut" />
            <input name="callbackUrl" type="hidden" value={demoAuthUiConfig.signOutCallbackPath} />
            <Button disabled={isSubmitting} type="submit" variant="outline">
              Sign Out
            </Button>
          </Form>
          {feedback ? <p className="mt-3 text-sm text-[var(--muted)]">{feedback}</p> : null}
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Session Diagnostics</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Authenticated</dt>
              <dd>{authenticatedUserId ? "yes" : "no"}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Current Identity</dt>
              <dd>{currentUserName}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Session Strategy</dt>
              <dd>{sessionStrategy}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Sign-in Route</dt>
              <dd>{signInRoute}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Auth Demo Enabled</dt>
              <dd>{String(authEnabled)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--muted)]">Demo Admin Email</dt>
              <dd>{adminEmail}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
