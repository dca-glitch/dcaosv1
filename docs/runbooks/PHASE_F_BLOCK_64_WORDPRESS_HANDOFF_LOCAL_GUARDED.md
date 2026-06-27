# Phase F Block 64 — WordPress Handoff Local Guarded Flow

**Status:** Operator flow for draft prepared → PublicationLog → no auto-publish (90% local scope).

**Scope:** Documentation + local smoke. No publish adapter logic changes.

Related:

- [`docs/security/WORDPRESS_PUBLISH_LOCAL_GATE.md`](../security/WORDPRESS_PUBLISH_LOCAL_GATE.md)
- [`POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md`](./POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md)
- `scripts/smoke-wordpress-publish-local.mjs`

---

## Operator flow (local, publish off)

1. Create client + publication target in Client Hub.
2. Prepare WordPress draft via AI Delivery deliverable handoff (no live publish).
3. Confirm **Publication log** records `PROVIDER_DISABLED` or prepared state when `WORDPRESS_PUBLISH_ENABLED` is unset/false.
4. Never enable live publish locally unless running the manual open-gate probe below.

---

## Run (baseline smoke)

Requires local API on **4000**.

```powershell
cd C:\dcaosv1
npm.cmd run smoke:wordpress-publish:local
```

Expect `provider_disabled` on publish attempts and PublicationLog entries without live HTTP.

---

## Run (open gate — owner/manual only)

See Post-MVP Block 45 runbook. Restore publish **off** before pre-staging.

---

## Pass criteria

- Baseline smoke PASS with default local env (publish disabled)
- No Application Password or ciphertext in responses or logs
- Client Hub publication log browser smokes remain PASS in pre-staging

---

## Deferred

- Live Puriva WordPress publish
- Production `WORDPRESS_PUBLISH_ENABLED` rollout
