# Pre-Production Readiness Checklist

Status: Plain-language checklist before any real production or live client access.

This checklist is for deciding whether DCA OS Lite is ready to move from local/admin operation toward production use.

Production must stay frozen until a separate approval block is completed.

Current post-merge baseline: PR #13 is merged into `main`, local `main` validation passed, and local pre-staging proof was accepted. No deploy, VPS migration, production restart, or release was performed. `system.digitalcubeagency.net` is a live production VPS target, not a confirmed staging target.

## How To Use This Checklist

Before production or live client access, every item below should be reviewed.

Use three answers:

- Ready: safe to use now.
- Not ready: must be fixed before production.
- Deferred: intentionally not part of the current production scope.

Do not treat a local smoke pass as full production readiness.

## 1. Basic System Readiness

- The app can be built successfully.
- The API can be built successfully.
- Local validation passes.
- Required smoke tests pass locally.
- Known local-only assumptions are documented.
- No unfinished experimental work is mixed into the release branch.
- No secret values are committed.
- Production environment values are prepared separately and reviewed.

## 2. Login And Access

- Admin login works.
- Logout works.
- Tenant selection works.
- Admin-only areas are not visible to normal client users.
- Client access is only granted to the correct client user.
- Client Portal shows only final client-safe information.
- Client review actions remain disabled or absent until formally built.

## 3. Client Portal Safety

Before giving a real client access, confirm:

- the client sees only their own client data;
- the client does not see internal projects from other clients;
- the client does not see raw AI prompts;
- the client does not see unfinished drafts;
- the client does not see admin notes;
- the client does not see technical logs;
- the client does not see hidden workflow statuses;
- the client archive contains only final approved work.

## 4. Admin Delivery Workflow

The admin should be able to complete the delivery path:

1. create or select a client;
2. create a monthly project;
3. add or update the brief;
4. prepare market context;
5. prepare content plan;
6. prepare and review drafts;
7. prepare images/assets if needed;
8. package deliverables;
9. prepare WordPress draft handoff if needed;
10. prepare the monthly report;
11. confirm client-safe archive visibility.

If any of these steps are confusing or broken, production should wait.

## 5. Reports And Deliverables

Before production:

- final deliverables should clearly belong to the right client and project;
- monthly reports should show only final client-safe data;
- download or export links should work as expected;
- private files should not be exposed publicly;
- report content should be admin-reviewed before client access.

## 6. Finance Safety

Before production finance use:

- invoice calculations must be trusted;
- bill and vendor records must be clear;
- credit notes must be reviewed carefully;
- archive/restore behavior must be understood;
- finance document upload/download behavior must be reviewed;
- any production payment or accounting integration must be separately approved.

## 7. Storage And Files

Before production file use:

- private storage settings must be production-ready;
- test buckets and production buckets must not be confused;
- signed downloads must be checked;
- public exposure rules must be reviewed;
- file names and storage paths should not reveal private data unnecessarily.

## 8. Email And Notifications

Before production sending:

- email provider settings must be reviewed;
- sending must be explicitly enabled;
- test messages must be sent to internal addresses first;
- client-facing templates must be reviewed;
- no automatic sending should happen by surprise.

Current MVP note: real provider sending and background notification queues are not active by default.

## 9. AI Provider And Cost Safety

Before enabling live AI provider use:

- provider keys must be configured safely;
- cost limits must be reviewed;
- admin-triggered execution must be confirmed;
- no autonomous high-cost background agents should run;
- output must remain admin-reviewed;
- provider logs must not expose secrets.

Current MVP note: local deterministic execution remains the default safe path.

## 10. Analytics And External Data

Before live analytics use:

- Google OAuth must be implemented and reviewed;
- client account permissions must be clear;
- analytics data must map to the correct client;
- client-facing metrics must be reviewed before exposure;
- manual or snapshot-first metrics can be used until live sync is approved.

## 11. Deployment Readiness

Before VPS or production deployment:

- confirm or create a real staging target; do not assume `system.digitalcubeagency.net` is staging;
- deployment plan reviewed;
- backup/restore plan reviewed;
- production database plan reviewed;
- domain and SSL routing reviewed;
- environment variables reviewed;
- rollback plan prepared;
- post-deploy smoke checklist prepared;
- client access remains off until final verification.

## 12. Go / No-Go Decision

Production can move forward only when:

- local validation is clean;
- relevant smoke tests pass;
- client visibility is proven safe;
- storage and downloads are reviewed;
- admin workflow is usable;
- production environment plan is ready;
- rollback plan exists;
- the owner explicitly approves production work.

If any critical item is uncertain, the decision is No-Go.

## Current Recommendation

Current state is suitable for controlled local/admin MVP work.

It is not automatically approved for production client access. Merge to `main` does not mean production has been updated. A separate staging target confirmation, production readiness review, and deployment block are still required.
