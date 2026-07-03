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

## Workflow execution attachment

Approved prompt-eligible knowledge is automatically composed into:

1. **AI Delivery workflow execution context** via `buildAiWorkflowKnowledgeContext` when a workflow run executes (`core.runtime.ts` → `executeAiDeliveryWorkflowRun`). This includes:
   - **`content_plan_draft`** when admin notes contain `[generate-content-plan]` (workflow-generated monthly content plan items).
   - **`article_draft`** when a workflow run targets a specific content-plan item.
2. **WorkflowBriefs MI/SEO AI run context** via the same helper when `triggerWorkflowBriefAiRun` executes (`workflow-brief.runtime.ts` → `executeWorkflowBriefAiRun`). Only safe `knowledgeContext` metadata is stored on `AiBriefRun`; raw `contextSection` is admin-internal prompt input only.
3. **WorkflowBriefs production plan generation** via `generateWorkflowBriefProductionPlan` (`workflowType: content_plan_draft`). Safe `knowledgeContext` metadata is stored on admin-only `ProductionPlan.planJson`.
4. **WorkflowBriefs content draft generation** via `generateWorkflowBriefContentDrafts` / `regenerateWorkflowBriefContentDraft` (`workflowType: article_draft`). Safe `knowledgeContext` metadata is stored on admin-only `ProductionPlan.planJson.contentDrafts`.

**Not Knowledge execution paths (XXL 3):** AI SEO manual `AiDeliveryContentPlan` CRUD and content-plan PDF export are admin-authored or render-only and do not call the context builder. WorkflowBriefs/Puriva deterministic seed paths do not call it directly.

Existing compact project/brief/research/MI context is preserved and composed alongside knowledge context in both paths.

Rules match default preview selection (approved-only, scoped, sanitized, token-trimmed). Execution logs record whether knowledge context was included or skipped.

Offline adapter wiring proof:

```powershell
npm run -w @dca-os-v1/api check:ai-workflow-knowledge-context
```

## Admin visibility (Block 6C-v1 — implemented)

Safe `knowledgeContext` metadata from WorkflowBriefs MI/SEO runs and plan/draft generation
(Blocks 6A/6B) is surfaced read-only on Workflow Briefs admin screens only. Allowed display
fields: `used`, `selectedCount`, `selectedItemTitles`, `skippedReason`,
`sanitizeFlagCount`, `trimmed`. Must not display raw `contextPreview`, `contextSection`,
`selectedSourcesJson`, knowledge bodies, or prompt internals. Admin `GET /workflow-briefs/:id`
projects safe run metadata from `AiBriefRun.inputSnapshotJson` without returning snapshot
internals. Not client-visible.

## Deferred

- Client-visible knowledge articles (separate future module)
- INDUSTRY-scope auto-inclusion across clients
- Knowledge picker / override on Workflow Briefs screens (Block 6C-v2)
- Dedicated `AiContextSnapshot` audit rows per brief run (Block 6D; `briefId` FK does not exist today)
- Optional AiDelivery admin read-only knowledge-usage visibility for workflow-generated content plans (deferred; not required for AI SEO PDF/CRUD paths)
