# Phase F Block 74 — AI Provider Guarded UX

**Scope:** Deterministic planning config; OpenRouter live remains opt-in off.

Related:

- [`POST_MVP_BLOCK_40_OPENROUTER_GUARDED_LOCAL_GATE.md`](./POST_MVP_BLOCK_40_OPENROUTER_GUARDED_LOCAL_GATE.md)
- `scripts/smoke-openrouter-guarded-local.mjs`

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:openrouter-guarded:local
```

## Pass criteria

- Guarded smoke PASS without live OpenRouter execution
- No API keys or provider secrets in logs

## Deferred

- Live OpenRouter cost execution
