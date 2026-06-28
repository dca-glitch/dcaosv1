# AI Operating Layer — Knowledge Base & Context Builder

## Purpose

The AI Operating Layer knowledge base stores typed, scoped, reviewed memory for admin-operated AI workflows. The context builder assembles a safe, tenant-bound preview from approved prompt-eligible items only (unless an admin explicitly opts into raw/expired inclusion).

See also: [AI Operating Layer Architecture](../ai-delivery/ai-operating-layer-architecture.md).

## MVP scope (implemented)

- CRUD for `AiKnowledgeItem` under `/api/v1/ai-operating-layer/knowledge-items`
- Promotion from AI Delivery research summaries, deliverables, and monthly reports
- Context preview under `/api/v1/ai-operating-layer/context-preview`
- Optional `saveSnapshot` → `AiContextSnapshot` for audit/replay
- Admin UI panel: `AiKnowledgeContextPanel` on AI Delivery project views

## Default context selection rules

Default preview (no flags) includes only rows where:

- `status = APPROVED`
- `allowedForPrompt = true`
- not expired (`status != EXPIRED` and `expiresAt` not in the past)
- scope is `SYSTEM`, matching `CLIENT`, or matching `PROJECT`
- `INDUSTRY` scope is never auto-included

Explicit admin-only overrides:

- `includeRaw: true` — adds `RAW` / `REVIEWED` items with warnings
- `includeExpired: true` — adds expired approved items with warnings

## Admin dry-run preview

`workflowType: "dry_run"` is the non-blocking admin preview mode. Missing optional context is reported as warnings/info, not blocking errors.

## Injection sanitization

All knowledge bodies, summaries, titles, and one-off admin instructions pass through `sanitizeUntrustedContextText` before appearing in `contextPreview`. Known injection phrases are replaced with `[REDACTED-UNTRUSTED]` and surfaced in `warnings`.

## Boundary guards

Context preview rejects mismatched `clientId` / `aiDeliveryProjectId` pairs and unknown/archived clients or projects for the active tenant. Blocked previews return `canRun: false` with `blockingReasons`.

## Smoke

```powershell
npm run smoke:ai-knowledge-context
```

Requires local API, applied Prisma migrations (including `20260628120000_ai_operating_layer_knowledge_context`), and `$env:AUTH_SEED_TEST_PASSWORD`.

## Deferred

- Client-visible knowledge articles (separate future module)
- INDUSTRY-scope auto-inclusion across clients
- Workflow-run automatic context attachment (workflow block)
