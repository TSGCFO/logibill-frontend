# Backend API Integration Track

**ID:** backend-api_20260201
**Status:** Active
**Type:** Feature

## Quick Links

- [Specification](./spec.md) - Requirements and acceptance criteria
- [Implementation Plan](./plan.md) - Phased task breakdown
- [Original Plan](file:///C:/Users/Hassan/.claude/plans/indexed-sparking-hanrahan.md) - Full migration plan

## Overview

Connect the completed Next.js frontend to the Flask backend by implementing 56 REST API endpoints.

## Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Auth Foundation | [ ] |
| 2 | Customer & Order APIs | [ ] |
| 3 | Invoice & Billing APIs | [ ] |
| 4 | Accrual & Admin APIs | [ ] |
| 5 | Materials & Services APIs | [ ] |
| 6 | Reports & Dashboard | [ ] |

**Total Progress:** 0/47 tasks (0%)

## Endpoints Summary

| Category | Count | Status |
|----------|-------|--------|
| Auth | 3 | [ ] |
| Customers | 8 | [ ] |
| Orders | 4 | [ ] |
| Invoices | 12 | [ ] |
| Billing | 9 | [ ] |
| Accrual | 4 | [ ] |
| Materials | 9 | [ ] |
| Services | 3 | [ ] |
| Reports | 5 | [ ] |
| Admin | 4 | [ ] |
| **Total** | **56** | |

## Commands

```bash
# Start backend
cd ../LogiBill && flask run

# Start frontend
npm run dev

# Test API
curl http://localhost:5000/api/v1/auth/me

# Run E2E tests
npm run test:e2e
```

## Related

- [Tech Stack](../../tech-stack.md)
- [TypeScript Style Guide](../../code_styleguides/typescript.md)
- [Workflow](../../workflow.md)
