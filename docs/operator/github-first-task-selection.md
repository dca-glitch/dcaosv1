# GitHub-First Task Selection

Status: Simple guide for choosing Mode A or Mode B.

This guide helps decide whether a task should be handled directly in GitHub or wait for local work later.

## Main Rule

Use GitHub first when the task can be completed and checked by reading repository files, changing text, reviewing diffs, or checking GitHub-side status.

Wait for local work only when the task must run the app, use local data, or prove browser/runtime behavior.

## Mode A: Direct GitHub Work

Use Mode A when the task is mostly text or planning.

Good Mode A tasks:

- write documentation;
- update operating rules;
- update design rules;
- create SOPs;
- create checklists;
- update status notes;
- update module planning;
- clean up wording;
- summarize repository files.

Mode A proof:

- commit exists;
- expected file changed;
- no source/runtime files changed unless intentionally stated.

## Mode B: GitHub Work With Extra Proof

Use Mode B when the change is still safe for GitHub, but should be checked more carefully.

Good Mode B tasks:

- small code cleanup;
- small UI copy update;
- small style-only update;
- small documentation/index update across multiple files;
- review of changed files;
- pull request review;
- checking if CI/status checks are available.

Mode B proof:

- GitHub compare result;
- changed-file list;
- patch or diff review;
- CI/status result when available;
- clear note about anything not proven.

## Wait For Local Later

Wait for local work later when the task needs:

- local API or web app running;
- browser testing;
- local database behavior;
- local test account login;
- local file upload/download proof;
- storage provider proof;
- migration testing;
- full local validation when CI is not enough.

## Default Choice

When unsure:

1. Use Mode A for docs and rules.
2. Use Mode B for low-risk repository changes with diff or CI proof.
3. Defer local runtime proof instead of forcing local work immediately.

## Report Format

Every GitHub-first task should end with:

- mode used;
- commit ID;
- changed files;
- proof used;
- what was not proven;
- whether local work is needed later.
