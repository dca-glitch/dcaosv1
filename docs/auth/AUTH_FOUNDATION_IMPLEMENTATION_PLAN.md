# DCA OS v1 - Auth Foundation Implementation Plan

## 1. Executive Summary

No real auth implementation now. Limited provider-agnostic skeleton work is approved.

## 2. Recommended Implementation Phases

1. provider and session final approval
2. env placeholders
3. auth route skeleton
4. callback and session verification
5. tenant selection
6. RBAC
7. frontend protected shell
8. audit events
9. tests

The current task only approves planning and skeleton preparation, not runtime auth.

## 3. Session Design

- cookie-based
- httpOnly
- secure in production
- sameSite
- expiration
- session store decision
- CSRF decision

## 4. Provider Strategy

- external/OIDC-first recommended
- client portal deferred
- no secrets in repo

## 5. API Routes Later

- login start
- callback
- logout
- session status
- tenant switch

## 6. Frontend UX Later

- login page
- tenant selector
- protected shell
- permission-aware navigation

## 7. Security Controls

- rate limiting
- CSRF
- safe redirects
- audit login events
- error safety

## 8. Open Decisions

- provider choice
- session store
- cookie domain
- callback URLs
- invitation flow
- client portal flow
- rate limit and CSRF timing
