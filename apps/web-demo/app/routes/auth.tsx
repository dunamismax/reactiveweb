import { Button } from "@reactiveweb/ui";
import { useMemo, useState } from "react";
import { Form, useNavigation, useSearchParams } from "react-router";
import { DataList } from "~/components/data-list";
import { InputField } from "~/components/input";
import { SectionHeader } from "~/components/section-header";
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
      return { message: actionData.error.message ?? "Auth request failed.", isError: true };
    }

    const status = searchParams.get("status");
    const error = searchParams.get("error");

    if (error) {
      return { message: "Sign-in failed. Check your credentials and try again.", isError: true };
    }

    if (status === "signed-in") {
      return { message: "Session established.", isError: false };
    }

    if (status === "signed-out") {
      return { message: "Session cleared.", isError: false };
    }

    if (status === "invite-accepted") {
      return { message: "Invite accepted. Sign in with your new password.", isError: false };
    }

    return null;
  }, [actionData, searchParams]);

  return (
    <section>
      <SectionHeader
        caption="Auth Lab"
        description="Demonstrates typed Auth.js configuration, credential validation, and session-aware UI."
        title="Auth.js Integration Surface"
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Credentials Demo</p>
          <Form className="mt-3 grid gap-3" method="post">
            <input name="intent" type="hidden" value="signIn" />
            <input name="callbackUrl" type="hidden" value={demoAuthUiConfig.signInCallbackPath} />
            <InputField
              label="Email"
              name="email"
              onChange={(event) => setEmail((event.target as HTMLInputElement).value)}
              type="email"
              value={email}
            />
            <InputField
              label="Password"
              name="password"
              onChange={(event) => setPassword((event.target as HTMLInputElement).value)}
              type="password"
              value={password}
            />
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
          {feedback ? (
            <p
              className={`mt-3 text-sm ${feedback.isError ? "text-[var(--tone-error-fg)]" : "text-emerald-300"}`}
            >
              {feedback.message}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Session Diagnostics</p>
          <div className="mt-3">
            <DataList
              items={[
                { label: "Authenticated", value: authenticatedUserId ? "yes" : "no" },
                { label: "Current Identity", value: currentUserName },
                { label: "Session Strategy", value: sessionStrategy },
                { label: "Sign-in Route", value: signInRoute },
                { label: "Auth Demo Enabled", value: String(authEnabled) },
                { label: "Demo Admin Email", value: adminEmail },
              ]}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
