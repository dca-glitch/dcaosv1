# GitHub Proof Checklist

Status: Mode B proof guide for ChatGPT GitHub-first work.

This checklist explains what counts as proof when work is done directly in GitHub instead of the local repository.

## Purpose

Mode B is used when ChatGPT makes a repository change in GitHub and then checks the change using GitHub-side evidence.

This is useful when the task does not need the user's local machine but still needs more than a simple commit report.

## What Counts As GitHub-Side Proof

Acceptable proof can include:

- changed file list;
- GitHub compare result;
- commit diff review;
- pull request diff review;
- individual file patch review;
- CI or GitHub Actions result if configured;
- commit status checks if available;
- confirmation that only expected files changed.

## What Does Not Count As Proof

Do not treat these as proof unless they actually happened:

- assuming validation passed;
- assuming TypeScript compiled;
- assuming browser smoke passed;
- assuming API endpoints worked;
- assuming database behavior is correct;
- assuming local environment variables are present;
- assuming storage/download behavior works.

## When GitHub Compare Is Enough

GitHub compare is usually enough for:

- documentation updates;
- design rules;
- operator manuals;
- SOP/checklist updates;
- small wording changes;
- status doc alignment;
- file additions that do not affect app runtime.

Expected report:

- commit ID;
- changed files;
- whether changes are docs-only;
- whether source/API/schema/package files were untouched.

## When CI Is Needed

CI or status checks are needed for:

- TypeScript code changes;
- React component changes;
- API code changes;
- package/script changes;
- shared type changes;
- anything that could break build or validation.

If CI is not available, say clearly:

`No GitHub-side CI proof was available. Local validation is deferred until local repo work resumes.`

## When Local Proof Is Still Required Later

Local proof is still required for:

- browser smoke;
- local API/Web startup;
- local database behavior;
- Prisma migrations applied locally;
- local auth/password smoke;
- R2/private storage proof;
- workflow runs requiring local services;
- anything involving local `.env` values.

## Mode B Report Template

Use this report after a Mode B task:

`Mode: GitHub + proof.`

`Commit(s):`

`Changed files:`

`Proof used:`

`What passed:`

`What was not proven:`

`Local proof needed later: Yes / No.`

`Production/deploy touched: No.`

## Safety Rule

If proof is incomplete, do not pretend the change is fully validated.

Use the safest wording:

`GitHub-side proof is clean. Local runtime proof is deferred.`
