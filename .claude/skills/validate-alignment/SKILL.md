---
name: validate-alignment
description: Validate that all frontend API calls have matching backend endpoints
disable-model-invocation: true
---

# Validate Frontend-Backend API Alignment

Run a cross-repository validation check to ensure every frontend endpoint has a matching backend route.

## Steps

1. Launch the `cross-repo-validator` subagent to audit both repos
2. Report any mismatches as CRITICAL or WARNING
3. If mismatches found, suggest fixes (which endpoints to add to which repo)

## Usage
```
/validate-alignment
```

This checks:
- All paths in `src/lib/api/client.ts` endpoints object
- All `@api_v1_bp.route` decorators in `api/v1/*.py`
- Any hardcoded `/api/v1/` strings in hooks that bypass the centralized client
- HTTP method alignment (GET/POST/PUT/DELETE)
