---
name: Zuu Studio architecture
description: Key decisions, gotchas, and module layout for the Zuu AI Video Studio project
---

## Auth
- Custom JWT via `jsonwebtoken` + `bcryptjs`; token in `localStorage` under `zuu_token`
- `SESSION_SECRET` env var required at startup (throws if missing)
- No Clerk, no Replit Auth — user explicitly rejected both

## Codegen
- Orval generates from `lib/api-spec/openapi.yaml` → `lib/api-client-react/src/generated/`
- `email: format:` removed from spec to avoid Zod v4 incompatibility
- Generated hooks re-exported from `lib/api-client-react/src/index.ts`

## Provider system
- Modular `VideoProvider` interface in `artifacts/api-server/src/providers/types.ts`
- Falls back to `mockProvider` if API key missing
- Kling requires two keys (`KLING_ACCESS_KEY` + `KLING_SECRET_KEY`) for JWT signing — `checkProviderKey` handles arrays
- Provider capabilities (supportedDurations, supportedAspectRatios) surfaced via `GET /api/providers` and used client-side to filter Studio form options

## Credits
- Atomic DB transactions with `WHERE credits >= needed` guard
- Every debit logs a `creditTransactions` entry
- Provider start failures trigger full refund

## Frontend patterns
- `ProtectedRoute` uses `useEffect` for navigation (not during render) to avoid React cascade crash
- `useFormField` stores `useFormContext()` result before null-checks
- All protected pages lazy-loaded with `React.lazy` + `Suspense`
- localStorage key `zuu_studio_prefill` used to pass data from Templates/Storyboard/Prompts/Characters into Studio on mount — always removed after reading
- Image upload: client-side canvas compression via `lib/imageCompressor.ts` (no external deps), exports `compressImage`, `formatBytes`, `dataUrlBytes`
- Recharts used for dashboard charts (AreaChart, PieChart, BarChart) — lazy-loaded, only hits bundle when Dashboard is visited

## ProviderPicker component type
- `description` field must be typed `string | null | undefined` to match `ProviderInfo` from generated API schema

## Known stubs
- `pikaProvider.ts` is a stub — not wired to real API; listed as disabled in `providers/index.ts`

## Trust proxy
- `app.set("trust proxy", 1)` added to silence `express-rate-limit` X-Forwarded-For warning

## Route ordering
- `GET /videos/stats` must be placed before `GET /videos/:id` in the Express router to avoid param collision

## Workflows
- Frontend: `pnpm --filter @workspace/zuu-studio run dev` (reads $PORT)
- API: `pnpm --filter @workspace/api-server run dev` (port 8080)
- Both must be running for auth/generation to work
