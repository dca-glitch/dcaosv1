# DCA OS v1 - Frontend Protected Shell Plan

## 1. Executive Summary

No real auth UI runtime yet.

## 2. Goals

- protected app shell
- tenant switcher later
- permission-aware nav later
- client portal separation later

## 3. Non-Goals

- no real login
- no real session calls
- no protected API calls
- no client portal implementation

## 4. Future Components

- LoginPage
- ProtectedLayout
- TenantSwitcher
- PermissionGate
- UserMenu
- AuthStatusBanner

## 5. State Strategy Later

- session status
- active tenant
- permissions
- loading and error states

## 6. Security UX

- do not show unauthorized modules
- safe logout
- no secret display

## 7. Open Decisions

- initial route shape
- whether the shell lives in the main app or a nested layout
- how tenant switching should be surfaced in the header
- whether the client portal needs a separate entry route later
