# AI Provider Local Configuration

Local-only guide for AI text provider env configuration before any VPS or staging work.

## Default behavior

- **Default AI mode:** `local` (deterministic). This is used when `AI_TEXT_GATEWAY` is unset or set to `local`.
- **OpenRouter / live provider:** opt-in only. Live calls run only when all required OpenRouter env values are present and `AI_TEXT_GATEWAY=openrouter`.
- **Startup safety:** the API does not require any provider secret at startup. Missing provider env must not crash the app.
- **Local validation:** `npm run validate` and baseline smokes do not require a provider key.

## Environment variables

| Variable | Required locally | Default / safe local value | Purpose |
|----------|------------------|----------------------------|---------|
| `AI_TEXT_GATEWAY` | No | `local` when unset | Selects `disabled`, `local`, or `openrouter` text execution |
| `OPENROUTER_API_KEY` | No | unset | Provider credential; never commit |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `OPENROUTER_TEXT_PRIMARY_MODEL` | No | unset | Primary text model id |
| `OPENROUTER_TEXT_SECONDARY_MODEL` | No | unset | Secondary model id |
| `OPENROUTER_TEXT_REVIEWER_MODEL` | No | unset | Reviewer model id |
| `OPENROUTER_TEXT_LONG_CONTEXT_MODEL` | No | unset | Long-context model id |

## Non-env guardrails (code policy)

These are not env variables. They stay in code so local/staging cannot accidentally widen cost or timeout bounds through env typos.

| Guardrail | Location | Value |
|-----------|----------|-------|
| Output token caps | `apps/api/src/core/ai-text-budget.policy.ts` | `AI_TEXT_BUDGET_POLICY_V1` |
| Hard context token limit | same file | `3200` approximate input tokens |
| OpenRouter HTTP timeout | `apps/api/src/services/openrouter-text.service.ts` | `20000` ms |

## Enable OpenRouter later (without committing secrets)

1. Keep repo `.env.example` unchanged with placeholders only.
2. On the target machine only, set values in the local `.env` file or shell env:
   - `AI_TEXT_GATEWAY=openrouter`
   - `OPENROUTER_API_KEY=<owner-provided-key>`
   - `OPENROUTER_TEXT_PRIMARY_MODEL=<owner-provided-model>`
3. Restart the API after changing env.
4. Run strict live smoke only when intentionally testing provider calls:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_OPENROUTER_LIVE = "true"
npm.cmd run smoke:openrouter-guarded:local
Remove-Item Env:SMOKE_EXPECT_OPENROUTER_LIVE -ErrorAction SilentlyContinue
```

5. Restore local defaults (`AI_TEXT_GATEWAY` unset or `local`, remove provider key) before other baseline smokes.

## Misconfiguration behavior

| Condition | Runtime behavior |
|-----------|------------------|
| Provider env missing | Local deterministic execution |
| `AI_TEXT_GATEWAY=disabled` | AI text execution blocked with safe failure |
| `AI_TEXT_GATEWAY=openrouter` without key/model | Live execution disabled; deterministic local fallback |
| Unrecognized `AI_TEXT_GATEWAY` value | Treated as `local`; runtime warning emitted |
| Fully configured OpenRouter | Live provider path available; still admin-triggered only |

## Local proof commands

Config-only (no API required):

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-provider-config:local
```

API-integrated guarded proof (requires local API + auth seed password):

```powershell
cd C:\dcaosv1
npm.cmd run smoke:openrouter-guarded:local
```

`npm run validate` also runs the config hardening runner through `@dca-os-v1/api` check.

## Related docs

- `docs/AI_PROVIDER_DATA_COLLECTION_DECISION.md`
- `docs/operator/ENV_READINESS_INVENTORY.md`
- `docs/runbooks/POST_MVP_BLOCK_40_OPENROUTER_GUARDED_LOCAL_GATE.md`

## VPS / staging note

This document covers local repo configuration only. Staging OpenRouter values belong in the server-side env at G4 and are not part of local hardening.
