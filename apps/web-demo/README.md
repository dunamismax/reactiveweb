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
VITE_DEMO_ADMIN_EMAIL=admin@reactiveweb.dev
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
- `AUTH_DEMO_PASSWORD` is used for deterministic local bootstrap/new-user default credentials.
- Tradeoff:
  - Pro: avoids a single process-wide plaintext equality check for authentication.
  - Con: demo users share one bootstrap secret unless you add a password-reset UI/flow.

## Deterministic Local Bootstrap

```bash
corepack pnpm run demo:bootstrap
```

What it does:

1. Runs Drizzle migrations (`packages/db/drizzle.config.ts`).
2. Seeds default workspace users if missing.
3. Backfills missing `password_hash` values idempotently.

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
  E --> F["load demo user by email"]
  F --> G["verify password hash"]
  G --> H["issue JWT session cookie"]
  H --> I["protected loaders/actions use requireAuthSession"]
```
