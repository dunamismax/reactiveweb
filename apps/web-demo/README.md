# web-demo

Flagship `reactiveweb` app rewritten to Nuxt + Vue while preserving the existing auth/user/activity domain behavior.

## Stack

- Nuxt + Vue 3 + TypeScript
- Tailwind CSS (semantic token theme)
- Postgres + Drizzle (`@reactiveweb/db`)
- Zod validation (`@reactiveweb/config` + app schemas)
- Cookie-based server auth/session flow with lockout enforcement
- Auth state is backed by Postgres and enforced server-side on every request

## Commands

From repository root:

```bash
bun run demo:bootstrap
bun run dev
bun run test:web-demo
bun run build
bun run typecheck
```

## Required Environment

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:55432/reactiveweb
AUTH_SECRET=replace-with-16+-char-secret
AUTH_DEMO_PASSWORD=replace-with-demo-password
AUTH_MAX_FAILED_SIGNIN_ATTEMPTS=5
AUTH_LOCKOUT_DURATION_MINUTES=15
DEMO_OWNER_USERNAME=owner
NUXT_PUBLIC_DEMO_OWNER_USERNAME=owner
```

## Routes

- `/auth`: sign in and public sign up
- `/`: dashboard metrics
- `/users`: user management
- `/users/:id`: user detail + reset workflow
- `/activity`: audit log + CSV export
- `/settings`: profile/password management
- `/stack`: stack contract and schema visibility
