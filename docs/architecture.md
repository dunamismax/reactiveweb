# ReactiveWeb Architecture

## Goals

- Host many React apps in one clean monorepo.
- Keep app-level autonomy while sharing stable building blocks.
- Use Bun-native workflows for speed and consistency.

## Standards

- New apps live under `apps/<app-name>`.
- Shared code must be extracted to `packages/*` only after two concrete reuses.
- Apps default to React Router framework mode with `ssr: false`.
- Validation uses Zod at all trust boundaries.
- Database access should compose through Drizzle schema modules.

## Delivery Rules

- Keep changes narrow and reviewable.
- Run lint + typecheck before merge.
- Document new shared packages in this file.
