import { createDemoUser } from "@reactiveweb/db";

import { requireSession } from "../../utils/auth-session";
import { assertCanCreateUser } from "../../utils/authorization";
import { recordAuditEvent } from "../../utils/demo-state";
import { createUserInputSchema } from "../../utils/models";
import { hashPassword } from "../../utils/password";
import { errorPayload } from "../../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  const body = await readBody(event);
  const parsed = createUserInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid user payload.",
    );
  }

  try {
    assertCanCreateUser(auth.user, parsed.data.role);
  } catch (error) {
    if (isError(error)) {
      return errorPayload(
        event,
        error.statusCode ?? 403,
        "FORBIDDEN",
        error.statusMessage ?? "Forbidden.",
      );
    }
    throw error;
  }

  const created = await createDemoUser({
    name: parsed.data.name,
    username: parsed.data.username,
    role: parsed.data.role,
    passwordHash: hashPassword(parsed.data.password),
    mustChangePassword: true,
  });

  if (!created) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      "Unable to create user. Username may already exist.",
    );
  }

  await recordAuditEvent({
    actorId: auth.user.id,
    action: "Created",
    target: `user ${created.username}`,
    details: `${auth.user.username} created ${created.username} (${created.role})`,
  });

  return {
    ok: true,
    message: "User created. Password rotation is required on first sign-in.",
  };
});
