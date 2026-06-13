# Error Handling Pattern

## Purpose

Errors should be handled consistently across the API.

## Expected Behavior

- route calls controller
- controller calls service
- service throws controlled errors when needed
- middleware normalizes response

## Future Error Types

- validation error
- not found error
- access error
- conflict error
- internal error

## Rule

Avoid leaking internal implementation details to the frontend.
