# DCA OS v1 - Seed Strategy Plan

## 1. Executive Summary

Local-only DB-1 seed implementation is approved for planning and guarded local execution.

No production seed is approved.

## 2. Seed Categories

- reference seeds
- local dev seeds
- bootstrap seeds
- test seeds
- production bootstrap seeds later

## 3. DB-1 Reference Seeds

- permissions
- module definitions
- default role templates if approved
- setting defaults

## 4. Idempotency Rules

- upsert by stable keys
- safe rerun
- no destructive resets without approval

## 5. Environment Safety

- local dev only by default
- refuse production unless explicit flag later
- no secrets
- no passwords
- no real client data
- refuse unsafe `DATABASE_URL` values

## 6. Audit Requirements

- bootstrap events
- seed version maybe

## 7. Future Implementation Plan

- script location
- dry-run option
- validation
- review before production

## 8. Open Decisions

- whether reference seeds live in data package or a dedicated seed package later
- whether production bootstrap needs a separate approval gate
- whether seed output should include a dry-run summary file
- whether the local placeholder admin email should be `admin@example.local` or `dca-admin@example.local`
