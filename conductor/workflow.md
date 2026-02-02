# LogiBill Frontend - Workflow

## TDD Policy

**Strictness Level:** Moderate

### Guidelines
- Tests encouraged but not blocking
- Required for complex business logic
- E2E tests for critical user flows
- Unit tests for utility functions

### Test Commands
```bash
npm run test:e2e        # Run all E2E tests
npm run test:e2e:ui     # Interactive UI mode
npm run test:e2e:headed # Run with browser visible
npm run test:e2e:debug  # Debug mode
```

## Commit Strategy

**Format:** Conventional Commits

### Commit Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Build, tooling, etc. |

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Examples
```
feat(customers): add customer activity feed component
fix(invoices): correct total calculation in line items
chore(deps): update TanStack Query to v5.62
```

### Scope Suggestions
- `customers`, `orders`, `invoices`, `billing`
- `materials`, `services`, `admin`
- `auth`, `api`, `ui`, `a11y`
- `deps`, `config`, `ci`

## Code Review Requirements

**Policy:** Required for non-trivial changes

### What Requires Review
- New features
- Bug fixes affecting business logic
- API integration changes
- Security-related changes

### What Can Self-Merge
- Documentation updates
- Minor styling tweaks
- Dependency updates (if tests pass)
- Typo fixes

## Verification Checkpoints

**Frequency:** After each phase completion

### Phase Verification Checklist
1. [ ] All phase tasks marked complete
2. [ ] TypeScript compilation passes (`npx tsc --noEmit`)
3. [ ] Linting passes (`npm run lint`)
4. [ ] E2E tests pass (if applicable)
5. [ ] Manual smoke test of affected features

### Track Completion Verification
1. [ ] All phases complete
2. [ ] Full test suite passes
3. [ ] Acceptance criteria from spec.md met
4. [ ] Documentation updated (if needed)

## Task Lifecycle

```
[ ] Pending → [~] In Progress → [x] Complete
```

### Task States
| Symbol | State | Description |
|--------|-------|-------------|
| `[ ]` | Pending | Not started |
| `[~]` | In Progress | Currently being worked on |
| `[x]` | Complete | Done and verified |

### Task Workflow
1. Mark task `[~]` when starting
2. Implement the change
3. Run verification (type check, lint)
4. Commit with conventional commit message
5. Mark task `[x]` when complete

## Branch Strategy

### Branch Naming
```
<type>/<track-id>-<short-description>
```

### Examples
```
feat/auth_20260201-login-page
fix/billing_20260201-calculation-error
```

## CI/CD Integration

### Pre-commit Checks
- TypeScript compilation
- ESLint
- Prettier (if configured)

### PR Checks
- Build succeeds
- E2E tests pass
- No TypeScript errors

### Deployment
- Vercel auto-deploy on main branch
- Preview deployments for PRs
