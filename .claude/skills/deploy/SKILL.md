---
name: deploy
description: Build, validate, commit, and push both repos for Replit deployment
disable-model-invocation: true
---

# Deploy to Replit

Complete deployment workflow for both LogiBill repos.

## Arguments
- `--frontend-only`: Only deploy frontend
- `--backend-only`: Only deploy backend
- `--skip-validation`: Skip cross-repo validation (not recommended)

## Steps

### 1. Validate
- Run TypeScript check: `npx tsc --noEmit`
- Run Python syntax check on all API modules
- Run cross-repo API alignment validation (unless --skip-validation)

### 2. Check for uncommitted changes
- `git status` on both repos
- Stage and commit any changes with descriptive message

### 3. Push
- `git pull --rebase && git push` on both repos
- Verify push succeeded

### 4. Verify
- Confirm both repos are clean (`git status` shows nothing)
- Report final commit hashes

## Repos
- Frontend: C:\Users\Hassan\Projects\logibill-frontend
- Backend: C:\Users\Hassan\Projects\LogiBill
