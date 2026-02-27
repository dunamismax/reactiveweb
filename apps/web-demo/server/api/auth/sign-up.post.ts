import { createDemoUser, getDemoUserByUsername } from "@reactiveweb/db";

import { ensureDemoSeeded, recordAuditEvent } from "../../utils/demo-state";
import { signUpInputSchema } from "../../utils/models";
import { hashPassword } from "../../utils/password";
import { errorPayload } from "../../utils/responses";

export default defineEventHandler(async (event) => {
  await ensureDemoSeeded();

  const body = await readBody(event);
  const parsed = signUpInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Sign-up failed.",
    );
  }

  const existing = await getDemoUserByUsername(parsed.data.username);
  if (existing) {
    await recordAuditEvent({
      actorId: existing.id,
      action: "SignUpFailure",
      target: `auth:user:${parsed.data.username}`,
      details: `Sign-up failed for ${parsed.data.username}; username already exists.`,
    });

    return errorPayload(event, 400, "BAD_REQUEST", "That username is already in use.");
  }

  const created = await createDemoUser({
    name: parsed.data.name,
    username: parsed.data.username,
    role: "viewer",
    passwordHash: hashPassword(parsed.data.password),
    mustChangePassword: false,
  });

  if (!created) {
    await recordAuditEvent({
      actorId: null,
      action: "SignUpFailure",
      target: `auth:user:${parsed.data.username}`,
      details: `Sign-up failed for ${parsed.data.username}; user creation returned no record.`,
    });

    return errorPayload(event, 500, "INTERNAL_ERROR", "Unable to create account.");
  }

  await recordAuditEvent({
    actorId: created.id,
    action: "SignUpSuccess",
    target: `auth:user:${created.username}`,
    details: `${created.username} created an account via public sign-up.`,
  });

  return {
    ok: true,
    message: "Account created. Sign in with your new credentials.",
  };
});
