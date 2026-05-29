# Repository Guidelines

## Project Structure & Module Organization

This is a Cloudflare Workers TypeScript app using Hono. The Worker entry point is `src/index.ts`, which wires middleware and route handlers. Route-specific logic lives in `src/handlers/`, shared services in `src/services/`, middleware in `src/middleware/`, database helpers and schema files in `src/db/`, reusable utilities in `src/utils/`, and shared interfaces in `src/types/`. Static assets are served from `public/`, including CSS under `public/assets/css/`, editor assets under `public/assets/editor/`, icons under `public/icons/`, and `public/favicon.ico`. D1 migrations live in `src/db/migrations/`.

## Build, Test, and Development Commands

Use pnpm; this repo includes `pnpm-lock.yaml`.

- `pnpm install` installs dependencies.
- `pnpm dev` starts `wrangler dev` for local Worker development.
- `pnpm typecheck` runs `tsc --noEmit` with strict TypeScript checks.
- `pnpm deploy` deploys via Wrangler.
- `pnpm db:migrate:local` applies `src/db/migrations/0001_initial.sql` to the local D1 database.
- `pnpm db:migrate:remote` applies the same migration to the remote D1 database.
- `pnpm db:create` creates the configured `flare-db` D1 database.

## Coding Style & Naming Conventions

Write ESM TypeScript with strict types. Follow the existing style: two-space indentation, single quotes, semicolons, and named exports for handlers, services, and utilities. Keep route handlers small and place cross-cutting logic in `src/middleware/` or `src/services/`. Use the `@/*` path alias only when it improves readability; relative imports are common in the current code. Preserve existing model field names when they map to persisted config, even when they use PascalCase.

## Testing Guidelines

There is no dedicated test framework configured yet. For every change, run `pnpm typecheck` before handing off. When adding tests, prefer colocated `*.test.ts` files or a `src/**/*.test.ts` convention, and add the matching script to `package.json`. For database changes, include a new migration under `src/db/migrations/` and verify it with `pnpm db:migrate:local`.

## Commit & Pull Request Guidelines

Recent commits use short conventional prefixes, for example `feat:`, `style:`, and `chore:`. Keep commit subjects imperative and scoped to one change. Pull requests should include a brief summary, local verification commands, any D1 migration notes, and screenshots for visible UI changes in `public/` or rendered handler output.

## Security & Configuration Tips

Do not hardcode production secrets. `FLARE_USER`, `FLARE_PASS`, and similar sensitive values should be set with `wrangler secret put`. Non-secret Worker settings belong in `wrangler.toml` under `[vars]`; update binding names in code and config together.
