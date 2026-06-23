# DCA OS Lite - Copilot CLI Permissions Guide

## A. Purpose

This guide documents the recommended Copilot CLI launch modes for local DCA OS Lite work.

Goals:
- Reduce repeated permission prompts during local development sessions.
- Keep the human in control of commit, push, deploy, merge, and production access.
- Prevent accidental broad access from --allow-all or --yolo flags.

This is not an unrestricted access configuration. Human gates remain in place for all
destructive or irreversible actions.

---

## B. Recommended default launch

Use this for most local implementation blocks (1-5 files, UI, API, backend, scaffolding):

```powershell
cd C:\dcaosv1
copilot --model auto --allow-tool='write' --allow-tool='shell(git:*)' --allow-tool='shell(npm.cmd:*)' --allow-tool='shell(node:*)' --deny-tool='shell(git commit)' --deny-tool='shell(git push)' --deny-tool='shell(npm.cmd install)' --deny-tool='shell(npm.cmd i)' --deny-tool='shell(ssh)' --deny-tool='shell(scp)' --deny-tool='shell(docker)' --deny-tool='shell(caddy)' --deny-tool='shell(kubectl)' --allow-url='http://localhost:4000' --allow-url='http://localhost:5173'
```

What this configuration does:
- Allows file edits (write tool).
- Allows local git inspection and non-destructive git operations (status, diff, log, branch, etc.).
- Allows npm.cmd local scripts such as validate, smoke, dev:api, and dev:web without prompting.
- Allows node local scripts without prompting.
- Blocks git commit and git push explicitly.
- Blocks npm install and npm i (package installs remain human-scoped).
- Blocks common deploy and server tools: ssh, scp, docker, caddy, kubectl.
- Allows localhost API and web URLs only (port 4000 and 5173).
- Does not allow all file paths or all URLs.

---

## C. Docs/scaffolding launch

Use this for docs-only patches, repo-memory updates, and instruction file changes:

```powershell
cd C:\dcaosv1
copilot --model auto --allow-tool='write' --allow-tool='shell(git:*)' --deny-tool='shell(git commit)' --deny-tool='shell(git push)' --excluded-tools='web_fetch,web_search'
```

What this configuration does:
- Best for docs-only and repo-memory patches.
- Excludes web_fetch and web_search to save AI credits unless web access is explicitly needed.
- Blocks commit and push.

---

## D. Autopilot warning

Do not use --allow-all or --yolo as the normal default for daily local work.

Do not create a permanent shell alias that always applies --allow-all or --yolo.

Autopilot mode (--autopilot) may be used only when:
- The block is sealed and well-scoped with a clear allowed-files list.
- A max continuation limit is set (--max-autopilot-continues).
- The human reviews the full diff before running git commit or git push.

Using autopilot does not bypass the human gate for commit, push, deploy, or merge.

---

## E. Optional controlled autopilot example

Use only for sealed, scoped blocks where autonomous continuation is explicitly approved:

```powershell
cd C:\dcaosv1
copilot --model auto --autopilot --max-autopilot-continues=5 --allow-tool='write' --allow-tool='shell(git:*)' --allow-tool='shell(npm.cmd:*)' --allow-tool='shell(node:*)' --deny-tool='shell(git commit)' --deny-tool='shell(git push)' --deny-tool='shell(npm.cmd install)' --deny-tool='shell(npm.cmd i)' --deny-tool='shell(ssh)' --deny-tool='shell(scp)' --deny-tool='shell(docker)' --deny-tool='shell(caddy)' --deny-tool='shell(kubectl)' --allow-url='http://localhost:4000' --allow-url='http://localhost:5173'
```

Set --max-autopilot-continues to a low number (3-5) for short blocks. Increase only if the
block explicitly requires it.

---

## F. Still forbidden under all launch modes

Regardless of which launch mode is used, the following remain forbidden unless the block
explicitly scopes and approves them:

- No git commit (human runs this explicitly after diff review)
- No git push (human runs this explicitly with separate approval)
- No deploy of any kind
- No VPS, server, or SSH access
- No production URLs (system.digitalcubeagency.net or any remote host)
- No .env file inspection
- No secret or credential search
- No printing of password values or env var values
- No npm/package installs unless the block scopes them
- No Prisma migrations unless the block explicitly approves them
- No parallel, fleet, or multi-agent execution unless the block lists it in scope

---

## G. When Copilot may still ask for permission

Even with safe launch flags, Copilot CLI may ask before taking actions outside the allowed
tool set.

Rules for responding:
- If Copilot asks to commit or push: answer no. Run those manually after diff review.
- If Copilot asks to deploy, SSH, or access a production URL: answer no. Stop and report.
- If Copilot asks to inspect .env or search for secrets: answer no. Stop and report.
- If Copilot proposes an action with unclear risk: stop and return to the ChatGPT gate before
  proceeding.

Human judgment is the final gate. Launch flags reduce prompts for routine actions; they do
not replace human review of risky actions.
