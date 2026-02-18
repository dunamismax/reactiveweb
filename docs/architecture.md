# ReactiveWeb Architecture

## Goals

- Host many React apps in one clean monorepo.
- Keep app-level autonomy while sharing stable building blocks.
- Use Bun-native workflows for speed and consistency.

## Standards

- New apps live under `apps/<app-name>`.
- `apps/web-demo` is the flagship implementation that should actively showcase the full stack.
- `apps/web-template` stays minimal as the default starter baseline.
- Shared code must be extracted to `packages/*` only after two concrete reuses.
- Apps default to React Router framework mode with `ssr: false`.
- Validation uses Zod at all trust boundaries.
- Database access should compose through Drizzle schema modules.

## Delivery Rules

- Keep changes narrow and reviewable.
- Run lint + typecheck before merge.
- Run build for app-impacting changes before merge.
- Document new shared packages in this file.
