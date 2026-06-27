# Development Workflow

This repository is local-first DCA OS Lite foundation and module work. Use Windows PowerShell from `C:\dcaosv1` unless a task explicitly says otherwise.

ChatGPT acts as scope controller/reviewer/task writer. Codex/Copilot/local tooling executes sealed tasks. Do not commit, push, deploy, edit GitHub cloud directly, or touch VPS/production unless explicitly approved after review.

Approved local commands:

```powershell
npm.cmd run validate
npm.cmd run smoke:local
npm.cmd run smoke:browser
npm.cmd run smoke:ai-delivery-reviews
```

Use smoke commands only when they are in scope for the task. Stability, regression, smoke, and module workflow work must include repeatable PowerShell/scripted validation as part of the deliverable.

Recommended sequence:

1. Make focused changes.
2. Run the task-approved validation command, usually `npm.cmd run validate`.
3. Run scoped smoke scripts when required by the task.
4. Review `git status --short --branch`, `git diff --check`, and `git diff --stat` before recommending any commit.

Forbidden for this phase:

* unapproved migrations
* `db push`
* unapproved database/auth/runtime changes
* production deployment
* VPS access
* commits unless explicitly approved
* pushes unless explicitly approved
* GitHub cloud edits unless explicitly approved

Current AI Delivery / email constraints:

* AI Delivery remains admin/operator-primary.
* **MVP 1 = Puriva client delivery.** Client Access Admin UI foundation is closed. **Client Portal MVP is required for Puriva** — client-safe visibility and human/client review before publication; advanced portal features remain phased. See [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).
* Email Notifications remains EN1 only: provider defaults exist, `notifications.digitalcubeagency.net` is verified for Resend, no API key is added, and no real sending is active.
* EN2 event wiring remains paused.
