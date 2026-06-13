# API Response Pattern

## Purpose

API responses should be consistent across all modules.

## Success Response

A successful response should include:

- success flag
- data payload
- optional metadata

## Error Response

An error response should include:

- success flag
- error code
- message
- optional details

## Metadata

Metadata can include:

- pagination
- filters
- timing later

## Rule

Do not return different response shapes for each module.
