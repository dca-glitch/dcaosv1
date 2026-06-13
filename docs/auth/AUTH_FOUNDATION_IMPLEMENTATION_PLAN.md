# DCA OS v1 - Auth Foundation Implementation Plan

## 1. Executive Summary

No real auth implementation now. Limited planning and skeleton work is approved for the controlled password MVP.

## 2. Recommended Implementation Phases

1. password and session final approval
2. env placeholders
3. auth route skeleton
4. session verification
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

- controlled username/email + password login
- client portal uses the same controlled model
- no secrets in repo

## 5. API Routes Later

- login
- logout
- session status
- password reset by admin
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

- password policy
- hashing library
- session store
- cookie domain
- rate limit and CSRF timing
