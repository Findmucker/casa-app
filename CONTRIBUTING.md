# Contributing to Casa App

Thank you for wanting to contribute! Here's everything you need to get started.

## Quick Start

```bash
git clone https://github.com/Findmucker/casa-app.git
cd casa-app
npm install
npm run dev
```

## Workflow

1. **Pick an issue** from [GitHub Issues](https://github.com/Findmucker/casa-app/issues) (#88–#97 are good starting points)
2. **Create a branch** from `develop`:
   ```bash
   git checkout develop && git pull
   git checkout -b feature/issue-XX-description
   ```
3. **Develop** and verify quality gates pass:
   ```bash
   npm run typecheck  # Zero errors
   npm run lint       # Zero warnings
   npm run build      # Build OK
   npm test           # Tests pass
   ```
4. **Commit** using Conventional Commits:
   ```bash
   git commit -m "feat: add savings progress bar"
   ```
5. **Push and open PR** targeting `develop`:
   ```bash
   git push -u origin feature/issue-XX-description
   gh pr create --base develop
   ```

## Branching Strategy

```
feature/* ──PR──► develop ──PR──► master
                    │                │
                    ▼                ▼
             Preview Deploy    Production Deploy
```

See [docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md) for full details.

### Branch naming

| Prefix | Usage |
|--------|-------|
| `feature/` | New functionality |
| `fix/` | Bug fix |
| `chore/` | Maintenance, deps |
| `i18n/` | Translations |
| `docs/` | Documentation |
| `hotfix/` | Urgent production fix (branch from `master`) |

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add friends system`
- `fix: prevent crash on empty habit days`
- `chore: update dependencies`
- `i18n: wire calendar strings`
- `docs: update contributing guide`

### PR title

Same format as commits. CI validates automatically.

## i18n

All user-visible strings must use `t("key")`:
```tsx
import { useT } from "@/lib/i18n";
const { t } = useT();
// ...
<p>{t("expenses.empty")}</p>
```

Add keys to both:
- `lib/locales/pt.ts` (Portuguese)
- `lib/locales/en.ts` (English)

The tutorial system is fully i18n-aware — update both locale files when modifying tutorial content.

## Code Style

- **TypeScript** strict (no `any`)
- **Tailwind** for styles (no custom CSS)
- **Components** in `components/` with PascalCase names
- **Hooks/utils** in `lib/`
- **Firestore types** in `lib/hooks.ts`
- **No external chart libraries** — use pure SVG for visualizations
- **No admin hierarchy** — all house members are treated equally in code

## CI/CD Quality Gates

The pipeline runs automatically on all PRs — all gates must pass:
- TypeScript typecheck
- ESLint
- Build verification
- Test suite
- PR title validation (conventional commits)
- Branch naming check
- Auto-labeling
- PR stats comment

## Tech Notes

- **Next.js 16** App Router — Firebase pages use `force-dynamic` export
- **Calendar** uses emoji indicators (not colored dots)
- **Charts** are pure SVG — no chart libraries allowed

## Questions?

Open an issue with the `question` label or reach out to the team.
