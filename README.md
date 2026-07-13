# Zuu AI Video Studio

A full-stack AI text-to-video platform with a premium dark cinematic UI. Generate, manage, and organise AI videos from multiple cloud providers — all in one place.

---

## Features

| Feature | Description |
|---|---|
| **Multi-provider generation** | Replicate (Minimax), Kling AI, Runway Gen-4, Luma Dream Machine |
| **Mock Mode** | Instant demo without any API keys |
| **Storyboard Generator** | Plan multi-scene productions and queue them all at once |
| **Prompt Templates** | 30+ curated cinematic prompts, organised by category |
| **Character Library** | Save and reuse character descriptions for AI consistency |
| **Saved Prompts** | Personal prompt library with style filtering |
| **Generation History** | Full archive with video player, favourites, and regenerate |
| **Dashboard Analytics** | Activity charts, status breakdown, and provider usage |
| **Credits System** | Per-generation billing with atomic credit transactions |
| **Admin Panel** | User management and generation monitoring |
| **Image Compression** | Client-side compression before upload — no large payloads |

---

## Architecture

```
/
├── artifacts/
│   ├── zuu-studio/        # React + Vite frontend (port $PORT)
│   └── api-server/        # Express 5 API server (port 8080)
├── lib/
│   ├── db/                # Drizzle ORM + PostgreSQL schema
│   ├── api-spec/          # OpenAPI 3.1 spec (openapi.yaml)
│   └── api-client-react/  # Orval-generated React Query hooks + Zod schemas
```

All packages are managed via **pnpm workspaces**.

---

## Quick Start (Replit)

1. **Fork / open this Repl** — workflows start automatically
2. The app runs in **Mock Mode** by default (no API keys needed)
3. Register an account and start generating demo videos immediately
4. Add real provider API keys in **Replit Secrets** to enable production generation

---

## Environment Variables / Replit Secrets

Add these in **Tools → Secrets** in the Replit sidebar.

### Required

| Secret | Description |
|---|---|
| `SESSION_SECRET` | JWT signing secret (any long random string) |

### AI Provider Keys (add whichever you have)

| Secret | Provider | Where to get it |
|---|---|---|
| `REPLICATE_API_TOKEN` | Replicate (Minimax video-01) | [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) |
| `KLING_ACCESS_KEY` | Kling AI | [klingai.com developer portal](https://klingai.com) |
| `KLING_SECRET_KEY` | Kling AI (JWT signing) | Same as above — both keys required |
| `RUNWAY_API_KEY` | Runway Gen-4 Turbo | [app.runwayml.com/account](https://app.runwayml.com/account) |
| `LUMA_API_KEY` | Luma Dream Machine | [lumalabs.ai/dream-machine/api](https://lumalabs.ai/dream-machine/api) |

> **Security:** API keys are read only from `process.env` on the server. They are **never** sent to the frontend or exposed in any API response.

---

## Provider Setup Details

### Replicate (Minimax video-01)
- Model: `minimax/video-01` for text-to-video
- Model: `minimax/video-01-image-to-video` for image-to-video
- Supported durations: 5s, 6s
- Supported aspect ratios: 16:9, 9:16, 1:1
- Pricing: ~$0.05–0.10 per generation (billed by Replicate)

### Kling AI
- Uses HMAC-SHA256 JWT authentication — **both** `KLING_ACCESS_KEY` and `KLING_SECRET_KEY` are required
- Model: `kling-v1` (standard mode)
- Supported durations: 5s, 10s
- Supported aspect ratios: 16:9, 9:16, 1:1, 4:5
- Pricing: varies by Kling subscription tier

### Runway Gen-4 Turbo
- Text-to-video: Gen-4 Turbo (`gen4_turbo`)
- Image-to-video: Gen-3 Alpha Turbo (`gen3a_turbo`)
- Supported durations: 5s, 10s
- Supported aspect ratios: 16:9, 9:16, 1:1, 4:5
- Pricing: billed in Runway credits (~500 credits per generation)

### Luma Dream Machine
- API version: `v1alpha`
- Supported durations: 5s
- Supported aspect ratios: 16:9, 9:16, 1:1, 4:3, 3:4, 21:9, 9:21
- Pricing: pay-per-generation via Luma API plan

---

## Running Locally (outside Replit)

```bash
# Clone and install
git clone <repo-url>
cd zuu-studio
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your secrets

# Push database schema
pnpm --filter @workspace/db run push

# Start all services
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/zuu-studio run dev   # Frontend on :5173
```

### Regenerate API client after spec changes

```bash
pnpm --filter @workspace/api-client-react run generate
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts, credits balance, role |
| `video_generations` | All generation jobs with status, provider, URLs |
| `credit_transactions` | Full audit ledger (debits on start, credits on refund) |
| `character_profiles` | Saved character descriptions |
| `saved_prompts` | User prompt library |
| `provider_settings` | Admin-controlled provider enable/disable |

---

## Development Notes

- **Credit safety:** credits are deducted atomically in a DB transaction with a `WHERE credits >= needed` guard. Provider failures trigger an automatic refund in a second transaction.
- **No polling rate abuse:** the status endpoint calls the provider's API on every poll request. The frontend polls every 3 seconds and stops automatically on terminal states.
- **Image upload:** images are compressed client-side (canvas API, max 1024×1024, 85% JPEG quality) before being sent. No raw large files hit the server.
- **Mock Mode:** always available as a fallback when no provider key is configured, or when `provider=mock` is explicitly selected.
- **Lazy loading:** all dashboard pages are code-split via `React.lazy` + `Suspense`. Recharts is loaded only when the Dashboard is visited.

---

## Credits System

| Action | Credits |
|---|---|
| Register (welcome bonus) | +50 |
| 5s Standard generation | −5 |
| 5s HD generation | −10 |
| 10s Standard | −10 |
| 10s HD | −20 |
| Failed generation (provider error) | Full refund |

Admins can adjust user credits via the Admin Panel (`/admin`).
