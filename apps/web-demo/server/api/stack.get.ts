import { appProjects, demoAuditLogs, demoUsers } from "@reactiveweb/db/schema";
import { getTableName } from "drizzle-orm";

import { requireSession } from "../utils/auth-session";
import { errorPayload } from "../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  return {
    ok: true,
    stack: [
      {
        label: "Runtime",
        detail: "Bun runs workspace installs, scripts, and local loops.",
      },
      {
        label: "Frontend",
        detail: "Nuxt + Vue with SSR-capable routes and typed data fetching.",
      },
      {
        label: "UI",
        detail: "Tailwind + semantic theme tokens aligned to the repo palette.",
      },
      {
        label: "Validation",
        detail: "Zod validates env config and mutation payloads at trust boundaries.",
      },
      {
        label: "Auth",
        detail: "Cookie session auth with server-enforced role and lockout policy.",
      },
      {
        label: "Data",
        detail: "Drizzle contracts map Postgres entities with strongly typed accessors.",
      },
    ],
    tables: [getTableName(appProjects), getTableName(demoUsers), getTableName(demoAuditLogs)],
  };
});
