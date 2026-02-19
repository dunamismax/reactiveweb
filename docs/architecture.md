# ReactiveWeb Architecture

## Goals

- Host many React apps in one clean monorepo.
- Keep app-level autonomy while sharing stable building blocks.
- Use Node.js + pnpm workflows for speed and consistency.

## Standards

- New apps live under `apps/<app-name>`.
- `apps/web-demo` is the flagship implementation that should actively showcase the full stack.
- `apps/web-template` stays minimal as the default starter baseline.
- Shared code must be extracted to `packages/*` only after two concrete reuses.
- Apps are SPA-first in UX/navigation; `web-demo` enables server runtime (`ssr: true`) where backend/auth is required.
- Validation uses Zod at trust boundaries (env + form/action payloads).
- Database access composes through Drizzle schema modules.

## Visual Theme Contract

- Canonical palette source is `COLOR_PALETTE.md`.
- UI baseline is `Main` > `Dark Soft` across repo apps.
- Use semantic CSS variables for surface/interactive/tone/role styling in `apps/web-demo/app/app.css`.
- Keep component class mappings centralized in `apps/web-demo/app/lib/semantic-styles.ts` to avoid route-level color drift.
- Shared `@reactiveweb/ui` components should consume semantic CSS variables first, with palette-aligned fallbacks.

## Delivery Rules

- Keep changes narrow and reviewable.
- Run lint + typecheck before merge.
- Run build for app-impacting changes before merge.
- Document new shared packages in this file.

## web-demo Runtime Reality

- Auth.js handlers are mounted at `/api/auth/*`.
- Protected loaders/actions call `requireAuthSession` and enforce active DB users.
- User mutations enforce explicit role-based authorization rules server-side.
- User and activity data flow through shared Drizzle accessors in `@reactiveweb/db` (`packages/db/src/demo.ts`).
- Auth credential checks use per-user password hashes (`demo_users.password_hash`).
- Failed sign-in tracking + temporary lockouts are persisted in `demo_auth_attempts`.
- `AUTH_DEMO_PASSWORD` remains a bootstrap/default-password input for local setup.

## web-demo Local Startup

```bash
corepack enable
corepack pnpm install
docker rm -f reactiveweb-postgres 2>/dev/null || true
docker run -d \
  --name reactiveweb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=reactiveweb \
  -p 55432:5432 \
  postgres:16-alpine
export DATABASE_URL="postgres://postgres:postgres@localhost:55432/reactiveweb"
export AUTH_SECRET="replace-with-16+-char-secret"
export AUTH_DEMO_PASSWORD="replace-with-demo-password"
export AUTH_MAX_FAILED_SIGNIN_ATTEMPTS="5"
export AUTH_LOCKOUT_DURATION_MINUTES="15"
export VITE_DEMO_OWNER_USERNAME="owner"
corepack pnpm run demo:bootstrap
corepack pnpm run dev
```
