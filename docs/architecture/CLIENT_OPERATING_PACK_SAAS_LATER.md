# Client Operating Packs — SaaS-later truth

**Status:** Architecture truth label (G214)  
**Date:** 2026-07-10  
**Audience:** Product owner, implementers, AI agents  

**Related:** [`CLIENT_OPERATING_PACKS.md`](./CLIENT_OPERATING_PACKS.md) · [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md)

---

## Truth label

Client Operating Packs are **Agency OS first** and labeled **`saas_later`**.

Typed pack constants in `packages/shared/src/client-operating-packs.ts` (`CLIENT_OPERATING_PACK_SAAS_READINESS`) record:

| Field | Value |
|-------|-------|
| `label` | `saas_later` |
| `agencyOsFirst` | `true` |
| `multiTenantSaasReady` | `false` |

---

## What this means

| Claim | Allowed? |
|-------|----------|
| Packs configure internal agency delivery for a client service line | Yes |
| Puriva is the first pack proof on generic Core/modules | Yes |
| Packs are a multi-tenant SaaS product today | **No** |
| Pack scaffolding implies self-serve onboarding / SaaS billing | **No** |
| Catalog templates imply live workflow execution | **No** |
| Entitlement matrix implies runtime portal enforcement | **No** (pure helpers only until separately approved) |

---

## Do not overclaim

Docs, status reports, and agent summaries must not describe current Client Operating Pack work as:

- “SaaS ready”
- “multi-tenant productized”
- “client self-serve pack marketplace”

Correct framing: **internal Agency OS configuration layer; SaaS productization is later.**
