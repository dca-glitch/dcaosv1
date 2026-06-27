# Post-MVP Block 40 — OpenRouter Guarded Local Gate

**Status:** Local smoke gate for read-only AI provider planning config and guarded workflow execution.

**Scope:** Read-only `GET /ai-provider/planning-config` plus smoke proof that default local mode keeps deterministic execution (`Gateway: local`). No live OpenRouter calls in baseline pre-staging.

Related:

- `apps/api/src/config/ai-provider.config.ts`
- `apps/api/src/services/ai-provider-planning.service.ts`
- `scripts/smoke-openrouter-guarded-local.mjs`

---

## Run (baseline — default local gateway)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:openrouter-guarded:local
```

Included in `npm run smoke:pre-staging:local`.

**Restart local API** after pulling this block so the new route is loaded.

---

## Run (strict OpenRouter live — owner/manual only)

1. Stop local API.
2. Set in `.env` or process env:

```env
AI_TEXT_GATEWAY=openrouter
OPENROUTER_API_KEY=<owner-provided-key>
OPENROUTER_TEXT_PRIMARY_MODEL=<owner-provided-model>
```

3. Restart API: `npm.cmd run dev:api`
4. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_OPENROUTER_LIVE = "true"
npm.cmd run smoke:openrouter-guarded:local
Remove-Item Env:SMOKE_EXPECT_OPENROUTER_LIVE -ErrorAction SilentlyContinue
```

5. Restore `.env` to local defaults before other smokes if needed.

---

## Pass criteria

- Admin login succeeds
- `GET /ai-provider/planning-config` returns safe planning snapshot (no API keys)
- Baseline: `textGateway=local`, `openRouterLiveExecutionEnabled=false`
- Workflow execute reports `Gateway: local` and `Model: local-deterministic`
- Strict mode (optional): live OpenRouter enabled and workflow reports `Gateway: openrouter`

---

## Notes

- OpenRouter remains opt-in; misconfigured `openrouter` gateway falls back to local deterministic adapter.
- Pre-staging orchestrator keeps baseline local gateway; strict live proof is manual/owner-triggered.
