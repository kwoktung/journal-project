# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Moment** is a couple's journal application built with Next.js on Cloudflare (D1 SQLite, R2 storage, Workers).

**Package Manager:** This project uses **Yarn** (not npm). Always use `yarn` commands.

## Commands

```bash
# Development
yarn dev                 # Dev server on port 4000
yarn build               # Production build
yarn lint                # Lint + type check
yarn test                # Run tests

# Database
yarn db:regenerate       # Regenerate all migrations + add custom SQL
yarn db:migrate          # Apply to local D1
yarn db:migrate:remote   # Apply to production D1

# Deployment
yarn deploy              # Build and deploy to Cloudflare
yarn cf-typegen          # Regenerate Cloudflare types

# API
yarn api:generate        # Regenerate OpenAPI client (requires dev server on :4000)
```

## Architecture

**Stack:** Next.js 15 + React 19, Hono (OpenAPI), Drizzle ORM, Cloudflare D1/R2/Workers, TanStack Query, shadcn/ui, Zod

**Key Structure:**

- `src/app/` - Next.js App Router: `(auth)/` = protected, `(login)/` = public, `api/[...rest]/` = Hono entry
- `src/database/` - Drizzle schema + migrations (auto-generated) + `custom-migrations/` (triggers, FTS5)
- `src/routes/` - Hono API domains (auth, posts, attachment, user, relationship) - each has `definition.ts`, `schema.ts`, route impl
- `src/services/` - Business logic layer (never access DB directly from routes)
- `src/hooks/` - React Query hooks: `queries/` for fetching, `mutations/` for updates
- `src/lib/auth/` - JWT, sessions, password hashing
- `src/lib/api-client/` - Auto-generated OpenAPI client
- `src/components/ui/` - shadcn/ui components

### Database (D1/SQLite via Drizzle ORM)

**Tables:** `users`, `posts` (FTS5 search), `attachments` (R2 refs), `relationships` (7-day grace period on deletion), `refresh_tokens`, `invitations`

**Custom Migrations:** `src/database/custom-migrations/` contains triggers and FTS5 setup appended to auto-generated migrations via `yarn db:add-custom`

**Workflow:** Edit `schema.ts` → `yarn db:regenerate` → `yarn db:migrate` (local) → `yarn db:migrate:remote` (prod)

**⚠️ D1 Transaction Limitations:**

- D1 does NOT support traditional SQL transactions (`BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`)
- Drizzle's `db.transaction()` API does NOT work with D1 (throws error, known bug)
- D1 operates in auto-commit mode to prevent global database blocking across distributed Workers
- **Use `.batch()` for atomic operations**: Batch operations execute as SQL transactions under the hood (all succeed or all rollback)
- Example from codebase: `invitation.service.ts:228` uses batch to atomically create relationship + delete invitation
- Performance benefit: Batch reduces latency by consolidating multiple round trips into one call

```typescript
// ✅ CORRECT: Use batch for atomic multi-statement operations
await db.batch([
  db.insert(table1).values({...}),
  db.delete(table2).where(...)
]);

// ❌ INCORRECT: Don't use SQL transactions or Drizzle transaction API
await db.run('BEGIN TRANSACTION');  // Fails!
await db.transaction(async (tx) => { ... });  // Fails! (Drizzle bug #2463, #4212)
```

### API (Hono + OpenAPI)

**Entry:** `/api/*` routes through `src/app/api/[...rest]/route.ts` to Hono app

**Routes:** `/api/auth`, `/api/posts` (paginated + search), `/api/attachment`, `/api/user`, `/api/relationship` (invitation system)

**Docs:** `http://localhost:4000/api/scalar` (interactive UI), `/api/docs` (JSON spec)

**Pattern:** Each route has `definition.ts` (paths + OpenAPI), `schema.ts` (Zod validation), implementation

### Authentication

**Tokens:** Access (15min) + Refresh (7-day) JWTs (HS256). Refresh tokens hashed in DB. Priority: Bearer header → Cookie → Auto-refresh

**Middleware:** `requireAuth()` in `src/lib/auth/route-helpers.ts`

### Services (Business Logic Layer)

Services accessed via context `{env, logger, db}`. Never access DB directly from routes.

Available: `AuthService`, `PostService`, `AttachmentService`, `RelationshipService`, `UserService`, `InvitationService`

### React Query

**Query keys:** Hierarchical in `src/lib/query-keys.ts`. **Optimistic updates** on all mutations. Cache: posts (1min), session (5min), infinite queries for cursor pagination.

### Cloudflare

**D1:** `env.DB` accessed via context. **R2:** Files named `{timestamp}-{uuid}.{ext}`, served via `/attachment/[...rest]`. **Secrets:** `JWT_SECRET` required (set via `yarn secrets:bulk`)

### UI Components

**Always** use CLI for shadcn/ui: `npx shadcn@latest add <component-name>`. Only create custom components if not in shadcn/ui or need business logic.

## Key Patterns

1. **Type Safety:** Zod for all API validation, auto-generate TypeScript types
2. **Service Layer:** Never access DB directly from routes
3. **Optimistic Updates:** All mutations update UI before server response (rollback on error)
4. **Cursor Pagination:** Posts use `{createdAt, id}` cursor
5. **Grace Periods:** Relationship deletion has 7-day restoration window

## Generated Files (DO NOT MODIFY)

- `cloudflare-env.d.ts` (use `yarn cf-typegen`)
- `src/lib/api-client/` (use `yarn api:generate`)
- `src/database/migrations/*.sql` (use `yarn db:regenerate`)

## Common Tasks

**Add API route:** Create `routes/<domain>/definition.ts` + `schema.ts`, implement in `services/<domain>-service.ts`, register in Hono

**Add DB table:** Edit `database/schema.ts` → `yarn db:regenerate` → `yarn db:migrate` → update services

**Add UI component:** Check shadcn/ui first (`npx shadcn@latest add <name>`), else create custom

**Deploy:** `yarn test` → `yarn lint` → `yarn db:migrate:remote` → `yarn deploy`
