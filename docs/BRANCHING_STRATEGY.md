# Branching Strategy

> Last updated: 2026-05-02

## Main Branches

| Branch | Purpose | Deploy |
|--------|---------|--------|
| `master` | Stable production | Vercel Production (auto) |
| `develop` | Feature integration | Vercel Preview (auto) |

## Working Branches

| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New functionality | `feature/friends-system` |
| `fix/` | Bug fix | `fix/pwa-cache-stale` |
| `hotfix/` | Urgent production fix | `hotfix/login-crash` |
| `chore/` | Maintenance, deps, docs | `chore/update-dependencies` |
| `i18n/` | Translations and localization | `i18n/wire-calendar-strings` |
| `docs/` | Documentation only | `docs/update-readme` |

## Workflow

```
feature/*  ──PR──►  develop  ──PR──►  master
    │                  │                │
    │                  ▼                ▼
    │           Preview Deploy    Production Deploy
    ▼
  Local dev
```

### 1. Create a working branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-XX-description
```

### 2. Develop and commit

```bash
git add <files>
git commit -m "feat: short description of what was done"
```

### 3. Push and Pull Request → develop

```bash
git push -u origin feature/issue-XX-description
gh pr create --base develop --title "feat: description" --body "..."
```

### 4. Merge to master (release)

When `develop` is stable and tested:

```bash
gh pr create --base master --head develop --title "release: v0.X.0"
```

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance, deps |
| `docs:` | Documentation |
| `style:` | Formatting (no logic change) |
| `refactor:` | Refactoring without behavior change |
| `perf:` | Performance improvement |
| `i18n:` | Translations |
| `ci:` | CI/CD pipeline changes |

## Rules

1. **Never commit directly to `master`** — always via PR from `develop`
2. **Never commit directly to `develop`** — always via PR from a working branch
3. **Hotfixes** are the exception: branch from `master`, PR to `master`, then cherry-pick to `develop`
4. **Delete branch** after PR merge
5. **Squash merge** for feature PRs (keep history clean on develop)
6. **Merge commit** from develop → master (preserve release history)

## CI/CD Quality Gates

All PRs must pass before merge:
- TypeScript typecheck
- ESLint (zero warnings)
- Build verification
- Test suite
- PR title validation (conventional commits format)
- Branch naming validation
- Auto-labeling based on changed files

## Branch Protections (GitHub)

### Branch `master`
- ✅ Require PR before merge
- ✅ Require 1 approval (or self-approve for solo dev)
- ✅ Require status checks (build + typecheck)
- ❌ Allow force push

### Branch `develop`
- ✅ Require PR before merge
- ✅ Require status checks (build + typecheck)
- ❌ Allow force push

## Versioning

Follow [SemVer](https://semver.org/):

- **MAJOR** (1.0.0) — breaking changes, total redesign
- **MINOR** (0.8.0) — new feature
- **PATCH** (0.7.1) — bug fix

Current version: **v0.8.0**

## Setup

```bash
# Create develop branch from master
git checkout master
git checkout -b develop
git push -u origin develop

# Vercel preview is automatic for develop branch
```
