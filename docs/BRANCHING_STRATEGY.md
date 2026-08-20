# Branching Strategy

`master` is the single long-lived release branch. Work happens on short-lived branches and returns to `master` after verification.

## Workflow

1. Update `master`.
2. Create a focused branch such as `fix/...`, `feature/...`, `refactor/...` or `codex/...`.
3. Make focused commits using Conventional Commits.
4. For Android/product changes run:
   - `npm run android:verify`
   - `npm run android:check`
   - `npm run android:build` when a local APK is useful
5. Review the diff and merge only intended changes.
6. Delete the short-lived branch after merge.

Android-related pushes to `master` trigger `.github/workflows/android.yml`, which verifies the app and can distribute the signed private beta through Firebase App Distribution.

The retained Vercel deployment is **not a web product**. It serves only the authenticated headless notification endpoint used by the Android app.

## Branch names

| Prefix | Use |
|---|---|
| `feature/` | New Android capability |
| `fix/` | Bug fix |
| `hotfix/` | Urgent production fix |
| `refactor/` | Structural/product refactor |
| `test/` | Test-only change |
| `docs/` | Documentation-only change |
| `chore/` | Maintenance or dependencies |
| `ci/` | Workflow and automation change |
| `codex/` | Codex-assisted work |

## Commit titles

Use `type(scope): short description`, for example:

- `fix(habits): surface failed writes`
- `refactor(android): simplify profile`
- `docs: document tester updates`

## Protection expectations

- Do not force-push `master`.
- Never commit signing keys, Firebase private credentials or tester identities.
- Keep the Android package/signing/version contract stable.
- Preserve Firebase/Firestore compatibility and production data.
- Do not reintroduce a user-facing web/PWA client without an explicit product decision.
