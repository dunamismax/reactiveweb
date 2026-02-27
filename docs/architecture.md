# ReactiveWeb Architecture

## Goals

- Host many Nuxt/Vue apps in one clean monorepo.
- Keep app-level autonomy while sharing stable building blocks.
- Use Bun workflows for speed and consistency.

## Standards

- New apps live under `apps/<app-name>`.
- `apps/web-demo` is the flagship implementation and should actively showcase the full stack.
- `apps/web-template` stays minimal as the starter baseline.
- Shared code moves into `packages/*` only after two concrete reuses.
- `packages/ui` remains a lightweight utility package for shared classes/helpers until there is real multi-app Vue component reuse.
- Validation uses Zod at trust boundaries (env + API payloads).
- Database access composes through Drizzle schema modules.

## Visual Theme Contract

- Canonical palette source is `COLOR_PALETTE.md`.
- UI baseline is `Main` > `Dark Soft` across apps.
- Use semantic CSS variables in app-level theme files (`apps/web-demo/assets/css/main.css`).
- Shared UI helpers should prefer semantic variables over hard-coded colors.

## Delivery Rules

- Keep changes narrow and reviewable.
- Run lint + typecheck before merge.
- Run build for app-impacting changes before merge.
- Document new shared packages in this file.

## web-demo Runtime Reality

- Server routes are implemented with Nuxt API handlers (`apps/web-demo/server/api/*`).
- Protected endpoints validate authenticated sessions server-side.
- Sessions use a custom signed-cookie transport layer; auth state is re-hydrated from the database on every request.
- User mutations enforce role-based authorization rules server-side.
- User and activity data flow through shared Drizzle accessors in `@reactiveweb/db`.
- Auth credential checks use per-user password hashes (`demo_users.password_hash`).
- Failed sign-in tracking + temporary lockouts are persisted in `demo_auth_attempts`.
- Forced password rotation is enforced both in API guards and route middleware.

## web-demo Local Startup

```bash
/Users/sawyer/.bun/bin/bun install
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
export DEMO_OWNER_USERNAME="owner"
export NUXT_PUBLIC_DEMO_OWNER_USERNAME="owner"
/Users/sawyer/.bun/bin/bun run demo:bootstrap
/Users/sawyer/.bun/bin/bun run dev
```
