# AGENTS.md

## Read this repository in this order

1. [`README.md`](README.md)
2. [`docs/README.md`](docs/README.md)
3. [`docs/CURRENT_SYSTEM_SNAPSHOT.md`](docs/CURRENT_SYSTEM_SNAPSHOT.md)
4. [`docs/STATUS.md`](docs/STATUS.md)
5. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
6. [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
7. [`docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
8. [`docs/operator/OPERATOR_RUNBOOK.md`](docs/operator/OPERATOR_RUNBOOK.md)
9. [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)

Apply the rest of this file only after reading that authority chain.

## Document authority rules

- Treat files explicitly marked **historical evidence**, **superseded**, **closeout**, or **proposal** as non-authoritative.
- Use [`docs/DOCUMENTATION_INVENTORY.json`](docs/DOCUMENTATION_INVENTORY.json) for file-by-file classification.
- Use [`docs/DOCUMENTATION_DISPOSITION.md`](docs/DOCUMENTATION_DISPOSITION.md) for the retained-vs-deleted refresh summary.
- Do not revive Dark Nebula or old next-gate ledgers as current truth.

## Current system truth you must preserve

- DCA OS Lite is an **internal agency operating system first**.
- Puriva is the first **Client Operating Pack** on the shared platform.
- AI Delivery is still **admin/operator-primary**; Client Portal MVP is client-safe visibility, approvals, archive, and FINAL monthly reports only.
- Clients must not see prompts, provider internals, AI cost details, raw workflow runs, credentials, `storageKey`, or admin-only notes.
- **Botanical Light** is the current UI direction. The frontend stays English-only.
- Current responsive proof references are desktop **1440**, tablet **768**, and mobile **390**.
- Complex workflows now prefer routed pages; short confirmation and single-purpose overlays may remain modals.
- Live GA4/GSC is **not implemented**. Approved future direction is `ADMIN_LIVE` (`APPROVED_DIRECTION_NOT_IMPLEMENTED`): DCA Admin only, separate service account per Website; Client Manager and Client User receive FINAL monthly reports only. Manual import is **not implemented**. Do not implement OAuth, service accounts, sync, or live analytics without a separate owner authorization.
- WordPress is an optional publishing connector. Current canonical docs only permit local prepared-draft/admin foundations unless a retained proof document explicitly records something narrower.
- Production exists but readiness is **NO** for new work unless current canonical docs explicitly authorize a separate gate.

## Agent operating rules

- Prefer the smallest safe change that fully resolves the task.
- Validate with `git diff --check` and task-required checks before claiming completion.
- Never run smoke after a failed `validate`.
- Do not inspect `.env` files, print secrets, or invent environment values.
- Do not treat historical audits, release notes, staging proofs, or production proofs as current implementation authority unless canonical docs explicitly adopt them.
- Do not treat approved direction as implemented; label it `APPROVED_DIRECTION_NOT_IMPLEMENTED` when relevant.

## Codex orchestration and token economy

- The main agent is the sole orchestrator and owns the plan, decisions, result integration, and final verification.
- Delegate only independent, bounded tasks when parallelism materially saves time or protects main-context capacity; do not delegate simple sequential work.
- Use at most three direct subagents. Subagents must not delegate further agents.
- Only one agent may modify a given file or area at a time.
- Use the least expensive suitable model for simple analysis and exploration; reserve stronger models for architecture, security, migrations, difficult defects, and final review.
- Use Graphify `query`, `path`, or `explain` before broad code reading. Do not repeat an identical read, command, or task without changed state or a new hypothesis; after two identical failures, stop retrying and change approach.
- Record a confirmed repeatable solution in the appropriate runbook only after it has been established.
- Detect the operating system. On Windows, use PowerShell and do not retry Unix-only commands unchanged.
- Act autonomously for safe, reversible repository-scoped changes. Ask the user before destructive operations, publishing, production actions, spending, secret disclosure, or material scope expansion.
- After every material session that changes code, architecture, or approved decisions, update the relevant existing authority-chain documents before the final response. Do not create a competing source of truth, and do not update documentation when no material change occurred.
- Keep the final response short and include the outcome, validation, changed documents, and actual blockers.

## DCA OS v2 agent routing and governance

- Cursor and Codex have **equal repository autonomy** for ordinary bounded work: branch, implementation, validation, independent review, PR, CI repair, and eligible merge. **One executor owns one file area at a time**; do not make concurrent Cursor and Codex edits to the same scope.
- In Codex sessions, use only GPT-5.6 Terra and GPT-5.6 Luna for DCA OS v2 work. Do not select Sol or Spark. Terra is the primary Codex implementation and integration agent (planning, code/configuration, security-sensitive reasoning, tests, commits, pushes, PRs, CI fixes, eligible merges). Terra defaults to Medium reasoning; use High only for genuinely ambiguous architecture, authorization or isolation, security, or migration-readiness analysis.
- Luna is an optional, bounded, read-only Codex supporting subagent for clear repeatable work only: targeted repository or document searches, extraction, classification, concise test or result summaries, and checklist verification. Luna must not edit product code or configuration, change branches, commit, push, create or merge pull requests, approve reviews, access secrets, or make authorization or migration decisions.
- Do not spawn subagents for trivial tasks. Use no more than two Luna subagents concurrently and no more than three direct subagents total; subagents must not delegate further agents. The project Codex config caps concurrent agent threads at two and nesting depth at one; role restrictions remain instruction-level policy.
- Codex auto-review handles routine workspace-write tool approvals in Codex sessions. Do not stop for human approval for routine repository reads, edits, local commands, tests, commits, pushes, PR creation, CI monitoring, or routine CI fixes when the assigned mission authorizes them.
- Every material code or policy diff requires a separate, read-only independent reviewer review of the exact unchanged diff before merge. The reviewer must record `APPROVE_READ_ONLY` or `REQUEST_CHANGES` with evidence in the PR/report, and remain distinct from the writer agent.
- Preserve AUTONOMY-HIGH for routine validated work and eligible merges after green CI and exact-diff review. A native GitHub approval is required only when branch protection technically requires it; never simulate or falsely claim one. When it is not technically required, the recorded independent reviewer decision plus green CI is sufficient for autonomous merge.
- Preserve all DCA OS/Tellanic OS separation and owner-critical exclusions. Owner involvement remains required for production or VPS actions, secrets, costs, destructive migrations, legal/privacy issues, live integrations, actual backfill/reconciliation/switch/cleanup, and unresolved critical/canonical conflicts.
- Phase 1 is complete and must not be reopened. Phase 2 runtime remains `NOT_STARTED`; only the merged offline P2-A foundation and disabled owner-run exporter are implemented. The P2-B owner execution gate is `DOCS_ONLY_AUTHORIZED` / `EXECUTION_NOT_AUTHORIZED`. Do not create a real snapshot, access a database, run Docker, execute the exporter, mutate data, backfill, reconcile, switch authority, clean up, or begin Phase 3 without a new explicit owner authorization.
- OpenClaw is **superseded** as current orchestration authority; historical OpenClaw notes are evidence only. Do not revive OpenClaw cron/controller plans as current operating authority. Do not perform production/VPS actions, access or disclose secrets, incur service costs, use live OAuth, remote database/staging actions, or Tellanic work without explicit owner authorization.
- Detect the operating system: use PowerShell on Windows and Bash in WSL/Linux; do not retry incompatible shell commands unchanged.

## Current UI authority

Use [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md) for current UI rules and proof references.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
