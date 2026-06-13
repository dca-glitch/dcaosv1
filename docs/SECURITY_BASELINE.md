# Security Baseline

This repository is in a medium-security foundation-hardening phase.

Approved now:

* workspace validation
* build validation
* Prisma schema validation only
* CI checks that do not require secrets or database services
* placeholder environment documentation

Blocked now:

* real authentication
* password/session/JWT handling
* real database persistence
* migrations
* `db push`
* deployment
* direct user-bound tenant roles in DB-1

Rules for contributors:

* Do not add production secrets to the repository.
* Do not commit real `.env` files.
* Do not wire runtime code to a real database yet.
* Keep validation commands non-destructive.
* Keep tenant access and audit rules append-only or review-gated in design docs before implementation.
