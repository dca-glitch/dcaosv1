# CRUD Pattern

## Purpose

CRUD modules should use a shared implementation approach.

## Standard Operations

- list
- read detail
- create later
- update later
- archive later

## List Page

A list page should include:

- title
- description
- empty state
- error state
- loading state

## Detail Page

A detail page should include:

- record title
- metadata
- status
- related actions later

## API Pattern

The API should keep routes thin and move business rules into services.

## Data Pattern

Repository access should be added after the data access layer is approved.

## Rule

Do not create a custom CRUD structure for every module.
