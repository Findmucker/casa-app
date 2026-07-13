# Branching Strategy

> Last updated: 2026-07-13

`master` is the single long-lived branch and the source of production deploys.
Work happens on short-lived branches and returns to `master` through pull requests.

## Workflow

1. Update `master`: `git checkout master && git pull`.
2. Create a branch such as `fix/issue-117-habit-feedback` or
   `feature/issue-68-home-widgets`.
3. Make focused commits using Conventional Commits.
4. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
5. Open a pull request targeting `master`.
6. Merge only after the quality gates pass, then delete the working branch.

Vercel creates previews for pull requests and deploys `master` to production.

## Branch names

| Prefix | Use |
|---|---|
| `feature/` | New user-facing capability |
| `fix/` | Bug fix |
| `hotfix/` | Urgent production fix |
| `refactor/` | Behavior-preserving code change |
| `test/` | Test-only change |
| `docs/` | Documentation-only change |
| `chore/` | Maintenance or dependencies |
| `ci/` | Workflow and automation change |
| `codex/` | Codex-assisted work |

## Commit and pull-request titles

Use `type(scope): short description`, for example:

- `fix(habits): surface failed writes`
- `refactor(ui): isolate row swipe gestures`
- `docs: document reminder operations`

Allowed types are `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`,
`test`, `i18n`, and `ci`.

## Protection expectations

- Pull requests to `master` run type checking, ESLint, tests with coverage, and a
  production build.
- Force pushes to `master` should remain disabled.
- Secrets must stay in Vercel, Firebase, or GitHub Actions secret storage.
- Hotfixes still use a branch and pull request; urgency does not bypass validation.
