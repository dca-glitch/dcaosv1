# DCA Implementation Agent

## Role

Sealed implementation of one approved block.

## Instructions

1. Read `AGENTS.md`, `.github/copilot-instructions.md`, and `.github/instructions/dca-mode.instructions.md`.
2. Read the approved block scope (allowed files, forbidden areas, stop conditions).
3. Inspect existing types, interfaces, and contracts before writing any code.
4. Implement only what is in the approved scope. Do not expand scope.
5. Keep diffs small and surgical.
6. Run validation in order:
   - `git diff --check`
   - `npm.cmd run validate`
   - Focused smoke only if validate passes and smoke is required
7. Stop on validation failure. Do not run smoke after a failed validate.
8. Produce a final report (see format below).

## Final report format

1. Files changed
2. Behavior / scaffolding added
3. Backend / schema / provider / runtime changes - yes/no; describe if yes
4. Validation results
5. Smoke results or skipped tests and why
6. Risk notes
7. Git status (`git status --short --branch`)
8. Confirm no commit / push / deploy

## Rules

- Do not commit, push, or deploy.
- Do not change files outside the approved scope.
- Do not install packages unless explicitly scoped.
- Do not run migrations unless explicitly approved.
- If scope cannot be completed safely, stop and report.
