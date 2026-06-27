# GitHub-First Reporting Standard

Status: Required report format for ChatGPT GitHub-first work.

This document keeps GitHub-first work easy to review. Every GitHub-first task should end with a short, consistent report.

## Purpose

The user should always know:

- what changed;
- where it changed;
- which commit was created;
- what proof was used;
- what was not proven;
- whether local work is needed later.

## Report Header

Start with the DCA gate:

`GATE: KEEP/FIX/REVERT/STOP | agent: yes/no | budget: low/medium/high | mistakes: number`

Then state the work mode:

- `Mode A: GitHub-only`
- `Mode B: GitHub + proof`

## Required Fields

Every report should include:

- commit ID or commit IDs;
- changed files;
- short summary of changes;
- proof used;
- what was not touched;
- whether local proof is deferred;
- whether production/deploy was touched.

## Mode A Report Template

Use this for docs and low-risk text work:

`Mode: A - GitHub-only.`

`Commit:`

`Changed files:`

`Summary:`

`Proof:`

`Not touched:`

`Local proof needed later: No / Deferred.`

`Production/deploy touched: No.`

## Mode B Report Template

Use this for GitHub work that includes extra proof:

`Mode: B - GitHub + proof.`

`Commit:`

`Changed files:`

`Proof used:`

`What passed:`

`What was not proven:`

`Local proof needed later: Yes / No / Deferred.`

`Production/deploy touched: No.`

## Good Proof Language

Use clear proof language:

- `GitHub compare shows only docs changed.`
- `Changed-file list matches expected scope.`
- `No source/API/schema/package files changed.`
- `CI status was not checked.`
- `Local runtime proof is deferred.`

## Bad Proof Language

Avoid saying:

- `validated` if no validation ran;
- `smoke passed` if no smoke ran;
- `works` if runtime was not tested;
- `safe for production` if production readiness was not proven;
- `client visibility proven` if client portal was not actually checked.

## Revert/Fix Language

If something goes wrong, use a direct gate:

- `GATE: FIX` if the change can be corrected.
- `GATE: REVERT` if the safest move is to undo the commit.
- `GATE: STOP` if proof is missing or risk is too high.

## Current Standard

For GitHub-first work, short and accurate beats long and vague.

Always separate what was changed from what was actually proven.
