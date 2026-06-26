# ChatGPT GitHub Operating Model

Status: Current working model for documentation and low-risk repository updates.

This document records the preferred operating model for DCA OS Lite work: use ChatGPT directly on the GitHub repository first, and return to local repository work later only when needed.

## Main Decision

The default model is now:

`A + B`

- Mode A: ChatGPT works directly in GitHub for documentation and low-risk repository updates.
- Mode B: ChatGPT works directly in GitHub and uses GitHub-side proof where available, such as pull requests, diffs, commit comparison, and CI/status checks.

Local repository work is paused as the default path. It remains available later when local runtime proof is needed.

## Why This Model Exists

The goal is to reduce laptop time and avoid unnecessary local command cycles.

For many tasks, ChatGPT can read files, update files, create commits, compare changes, and keep documentation aligned directly in GitHub.

This is especially useful for:

- documentation;
- operating rules;
- design rules;
- SOPs;
- checklists;
- planning docs;
- status docs;
- low-risk text updates;
- small safe cleanup tasks.

## Continuation Rule

When the user approves GitHub-first work and says to continue, ChatGPT should continue in useful batches instead of stopping after each small commit.

Stop only when:

- GitHub connector blocks the write repeatedly;
- the next change needs a product decision;
- the next change needs local runtime proof;
- the scope would touch source, schema, auth, storage, provider, finance logic, client visibility, or production;
- there is no longer a useful low-risk documentation or planning update to make.

For docs-only work, create focused commits and report the batch after useful progress is made.

## Mode A: GitHub-Only Work

Use Mode A for work that does not need the app to run locally.

Good examples:

- create or update docs;
- update operator manuals;
- update design rules;
- update deferred-scope registers;
- update module completion status;
- update readiness checklists;
- make small wording fixes;
- review repository files and summarize them.

Mode A rules:

- work directly on the active GitHub branch;
- keep commits small and focused;
- do not touch secrets;
- do not make schema, auth, provider, storage, or production changes;
- report changed files and commit IDs;
- local pull can happen later when the user wants to sync the laptop.

## Mode B: GitHub + Remote Proof

Use Mode B when repository changes need stronger proof but do not require the user's local machine.

Good examples:

- small code cleanup where CI can validate;
- TypeScript-only changes if CI runs validation;
- documentation changes that should be checked through GitHub diff;
- pull request review and patch inspection;
- checking commit status or workflow status when available.

Mode B proof can include:

- GitHub compare result;
- changed-file list;
- pull request diff;
- commit status checks;
- GitHub Actions results if configured;
- explicit review of the touched files.

Mode B rules:

- prefer branches or small direct commits, depending on task risk;
- do not claim runtime proof unless CI or an actual runtime check exists;
- if CI is unavailable, say so clearly;
- if GitHub-side proof is insufficient, defer local proof until later.

## Local Repository Work Later

Local repo work is not the default right now.

Return to local work later for tasks that need:

- local API/Web startup;
- browser smoke testing;
- local database state;
- local environment variables;
- local passwords or private test credentials;
- R2/private storage proof;
- migrations applied to a local database;
- Playwright browser proof;
- anything that cannot be proven from GitHub alone.

## What ChatGPT Should Not Claim In GitHub-Only Mode

Do not claim:

- `npm run validate` passed unless it actually ran in CI or locally;
- browser smoke passed unless a browser smoke actually ran;
- API endpoints worked unless they were actually exercised;
- R2/storage worked unless tested;
- local database behavior worked unless tested;
- production readiness unless separately approved and proven.

## Commit And Reporting Rules

For GitHub direct work, each report should include:

- whether the work was GitHub-only or GitHub + proof;
- commit ID(s);
- changed files;
- whether only docs/text changed;
- what was intentionally not changed;
- whether local sync is needed later.

## Current Preference

For now, use:

1. Mode A for documentation, rules, SOPs, and planning.
2. Mode B for low-risk repo changes where GitHub-side proof is enough.
3. Local repo later only when runtime proof is required.

## Safety Boundary

GitHub-first does not mean production-first.

Production, VPS, live client access, provider sending, live analytics, migrations, and client-facing behavior changes still need a separate approval block.
