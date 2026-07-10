---
name: Zuu Studio architecture
description: Key decisions, gotchas, and patterns for the Zuu AI Video Studio full-stack app
---

## Auth
- Custom JWT auth (not Clerk / Replit Auth) — user's explicit choice
- JWT stored in localStorage under key `zuu_token`; token getter registered via `setAuthTokenGetter` from `@workspace/api-client-react`
- `SESSION_SECRET` env var is required; server throws at startup if absent (no fallback default)
- `signToken` / `requireAuth` / `requireAdmin` live in `artifacts/api-server/src/middlewares/auth.ts`

## Codegen
- Orval generates from `lib/api-spec/openapi.yaml` → `lib/api-client-react/src/generated/`
- Generated hooks use TanStack Query v5 — `UseQueryOptions` requires `queryKey`; always provide it via the generated getter (e.g. `getGetMeQueryKey()`) when passing custom query options
- `@workspace/api-client-react` main index exports everything including `setAuthTokenGetter` — avoid sub-path imports (`/custom-fetch`, `/api.schemas`) as they require explicit `exports` map entries

## API response shapes
- List endpoints that are NOT paginated return plain arrays: `CharacterProfile[]`, `ProviderInfo[]` — do NOT access `.items` on them
- Paginated list endpoints return `{ items, total, page, limit }`: videos, admin users, admin jobs, saved prompts
- `useAdjustUserCredits` mutation argument shape: `{ id: number, data: CreditAdjustInput }` (NOT `userId`)
- `ListAdminJobsParams` only has `status` and `page` — no `limit` field

## Credit system
- Credits are deducted atomically in a DB transaction with a `WHERE credits >= needed` guard to prevent race-condition overdrafts
- Every credit deduction inserts a `creditTransactionsTable` record in the same transaction
- On provider start failure: credits are refunded atomically (transaction: update users + insert credit transaction + mark generation failed, creditsUsed=0)

## Provider system
- `getProvider(id)` in `providers/index.ts` falls back to mock if no API key
- Mock provider simulates ~15s generation lifecycle with in-memory job state
- Real providers (Replicate, Kling, Runway, Luma, Pika) are stubs with TODO comments

## DB schema
- Tables: users, videoGenerations, characterProfiles, savedPrompts, creditTransactions, providerSettings
- All in `lib/db/src/schema/`; pushed to Replit's pre-provisioned PG via `pnpm --filter @workspace/db run push`

**Why:** Recorded because the generated hook `queryKey` requirement and the sub-path export issue each caused non-obvious TypeScript failures that took multiple attempts to resolve.
