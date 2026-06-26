# Admin Decision Log Rules

Status: Plain-language rules for recording important admin decisions.

This guide explains when a decision should be written down and what the note should include.

## Purpose

Important decisions should be easy to understand later.

A good decision note explains:

- what was decided;
- why it was decided;
- what is included;
- what is not included;
- what should happen next.

## When To Record A Decision

Record a decision when it affects:

- client visibility;
- monthly delivery process;
- production readiness;
- system workflow rules;
- UI direction;
- finance behavior;
- provider usage;
- deferred scope;
- module priority.

## Decision Note Format

Use this format:

`Decision:`

`Reason:`

`Included:`

`Not included:`

`Risk:`

`Next action:`

## Good Decision Example

Decision:

`Use ChatGPT GitHub-first for documentation and low-risk repository updates.`

Reason:

`This reduces local command cycles and keeps documentation moving faster.`

Included:

`Docs, rules, SOPs, checklists, status updates, and low-risk text changes.`

Not included:

`Runtime proof, browser testing, local database checks, deployment, and production changes.`

Next action:

`Use Mode A or Mode B unless local proof is required later.`

## PR Decision Notes

Use a PR when the change should be reviewed before merging.

## Keep Decisions Simple

A decision note should be short enough to read quickly.

Avoid writing long technical explanations unless the decision itself is technical.

## Client-Facing Decisions

If a decision affects what clients can see, always record:

- what the client can see;
- what the client cannot see;
- whether the behavior is active now or deferred.

## Production Decisions

If a decision affects production, always record:

- whether production is approved;
- what proof exists;
- what rollback plan exists;
- what still needs review.

Current rule: production remains frozen unless explicitly approved.
