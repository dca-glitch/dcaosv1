# P2-A Offline Foundation

Status: `IMPLEMENTATION_READY_AUTHORIZED` / `PHASE_2_RUNTIME_NOT_STARTED`

This package is an offline validator and evidence-packet builder. The current implementation and tests use tracked synthetic fixtures only. They do not create, request, process, or consume a real owner snapshot.

## Owner-provided input contract

In a later, separately authorized run, the owner may place one anonymized JSON snapshot outside Git under `C:\dcaosv1-p2-evidence`. The file must use `DCA_OS_V2_P2_A_SNAPSHOT_V1` and contain only pseudonymous keys:

- `selection.tenantLabel` and `selection.tenantSelectionHash`, where the hash is SHA-256 of the label;
- exactly one active `records.tenants` entry;
- active `clients`, `memberships`, and `clientUserAccess` records using `*Key` references only;
- `proposedMappings.tenantToWorkspace`, `clientToWorkspace`, and `membershipRoles`;
- `accessInvariant.clientUserAccessCount` and `accessInvariant.clientUserAccessSha256`;
- `manifest.algorithm = SHA-256`, `manifest.canonicalization = SORTED_KEYS_AND_DECLARED_RECORD_ORDER_V1`, and the canonical `manifest.inputSha256`.

Source IDs, names, e-mail addresses, PII, credentials, connection strings, raw records, and database fields are rejected. The evidence directory is outside Git, has no cloud sync or automatic deletion, and later deletion is an owner decision after Phase 2 closeout.

## Validation guarantees

`p2-a-offline-foundation.mjs` is pure file/input validation. It has no Prisma import, database client, environment connection, mutation path, apply mode, or runtime integration. It fails closed when:

- the active-Tenant selection is missing, ambiguous, or hash-inconsistent;
- the canonical manifest/hash is missing or inconsistent;
- a tenant, client, membership, access record, or mapping is duplicated, orphaned, cross-tenant, or cross-workspace;
- a role is unknown or a mapping is incomplete/ambiguous;
- the six policy-provided known no-role membership keys are not exactly present with no role;
- any new no-role exception appears, or any known no-role record receives a role/access mapping;
- the `ClientUserAccess` count or SHA-256 hash changes; or
- an unsupported mapping group or apply-like argument is supplied.

The six known no-role records are emitted as `OWNER_REMEDIATION_REQUIRED`, with `defaultRole: null` and `accessGranted: false`. Workspace-derived access grants are always zero. The report is a decision/evidence packet for a later `P2_B_GATE_REQUIRED`; it is not an execution authorization.

## Synthetic validation

The tracked fixture and policy contain no real identifiers or data:

```text
packages/data/fixtures/p2-a-synthetic-valid.json
packages/data/fixtures/p2-a-synthetic-policy.json
```

Run the focused tests from `packages/data`:

```text
npm run test:p2-a
```

In a later owner-authorized run, a file may be validated with an explicit policy path. Do not create or copy a real snapshot in this repository:

```text
npm run workspace:p2-a:validate -- --snapshot <owner-file-outside-git> --policy <policy-file-outside-git> --format json
```

All future P2-B/C preparation remains restricted to `127.0.0.1:5434` and isolated restore `127.0.0.1:5435`, with a fresh backup/hash and successful restore rehearsal before any separately authorized write. Failure requires abort and evidence preservation; only the owner decides resume or rollback. Flags remain OFF, endpoint authority remains `LOCAL_ONLY`, and Tenant/Client/ClientUserAccess remain runtime authority. No backfill, reconciliation execution, switch, cleanup, Phase 3, remote, staging, production, VPS, secrets, or Tellanic operation is included.
