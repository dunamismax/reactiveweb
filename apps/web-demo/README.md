# web-demo

Flagship ReactiveWeb app that demonstrates the full stack contract in one place:

- React Router framework mode with server runtime enabled for Auth.js + DB actions
- SPA-first React 19 + TypeScript UI
- Tailwind + shadcn-style primitives
- Zod input/env validation
- Auth.js credential/session handling
- Drizzle/Postgres integration via shared packages

## Commands

From repository root:

```bash
corepack pnpm run demo:bootstrap
corepack pnpm run dev
corepack pnpm run test:web-demo
corepack pnpm run build
corepack pnpm run typecheck
```

## Required Environment

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:55432/reactiveweb
AUTH_SECRET=replace-with-16+-char-secret
AUTH_DEMO_PASSWORD=replace-with-demo-password
AUTH_MAX_FAILED_SIGNIN_ATTEMPTS=5
AUTH_LOCKOUT_DURATION_MINUTES=15
VITE_DEMO_OWNER_USERNAME=owner
```

Recommended local DB bootstrap:

```bash
docker rm -f reactiveweb-postgres 2>/dev/null || true
docker run -d \
  --name reactiveweb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=reactiveweb \
  -p 55432:5432 \
  postgres:16-alpine
```

## Auth Domain Model

- Credentials are verified against per-user password hashes in `demo_users.password_hash`.
- Authentication is username/password only.
- Public self-signup creates viewer users.
- Owner/admin user creation and password reset flows are direct (no invite links).
- Failed sign-in tracking and lockouts are persisted in `demo_auth_attempts`.

## Deterministic Local Bootstrap

```bash
corepack pnpm run demo:bootstrap
```

What it does:

1. Runs Drizzle migrations (`packages/db/drizzle.config.ts`).
2. Seeds default workspace users if missing.
3. Backfills missing `password_hash` values idempotently.

## Local Username-First Sign-In Flow

1. Start the app:
```bash
corepack pnpm run demo:bootstrap
corepack pnpm run dev
```
2. Open `http://localhost:5173/auth`.
3. Sign in as `owner` (or `VITE_DEMO_OWNER_USERNAME`) using `AUTH_DEMO_PASSWORD`.
4. Use public sign-up on `/auth` to create new viewer accounts.

## Admin Reset + Forced Rotation

- Password reset from user detail writes a new hash and sets `must_change_password=true`.
- On next sign-in, the user is forced to `/settings?required=password-change`.
- Settings password change clears `must_change_password` and restores full route access.

## Lockout and Rate-Limit Knobs

- `AUTH_MAX_FAILED_SIGNIN_ATTEMPTS`: failed attempts allowed before lockout (default `5`).
- `AUTH_LOCKOUT_DURATION_MINUTES`: lockout duration in minutes (default `15`).
- Lockout state is username-keyed, persisted server-side, and cleared on successful sign-in.

## Troubleshooting

1. Local auth failures (`AUTH_DEMO_PASSWORD` / session issues):
- Run `set -a; source .env; set +a` before running dev/test commands.

2. Drift after local data mutation:
- Re-run `corepack pnpm run demo:bootstrap`.
- If the local DB was heavily modified, recreate the local Postgres container and seed again.

## Auth Flow (Credentials)

```mermaid
flowchart LR
  A["POST /auth action"] --> B["server validates form with Zod"]
  B --> C["server fetches Auth.js CSRF state"]
  C --> D["forward POST /api/auth/callback/credentials"]
  D --> E["Auth.js authorize"]
  E --> F["load demo user by username"]
  F --> G["verify password hash"]
  G --> H["issue JWT session cookie"]
  H --> I["protected loaders/actions use requireAuthSession"]
```
