# Auth Gate

Status: blocked.

Approved now:

* documenting future auth shape
* placeholder security requirements
* auth gate design planning
* auth and tenant dependency mapping

Blocked now:

* login
* session storage
* JWT handling
* password hashing flows
* role enforcement
* tenant-aware access logic

Required before implementation:

* confirm auth provider and session strategy
* confirm whether auth is local-first or external-provider driven
* confirm password policy and account lifecycle rules
* approve [Auth Gate Design](../auth/AUTH_GATE_DESIGN.md)

Current review status:

* auth remains blocked
* tenant middleware remains blocked
* dependency mapping exists for later implementation planning
