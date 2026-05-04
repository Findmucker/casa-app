@AGENTS.md

# Casa App — Project Intelligence

## Quick Reference

- **Stack**: Next.js 16 App Router, Firebase Firestore, TypeScript, Tailwind CSS, PWA
- **Deploy**: Vercel (auto-deploy on push to master)
- **Auth**: Firebase Auth (email/password), real-time house membership via `onSnapshot`
- **i18n**: Custom system in `lib/i18n.tsx` with `lib/locales/pt.ts` (source of truth for types) and `lib/locales/en.ts`
- **Type check**: `npx tsc --noEmit` (always run before committing)
- **GitHub**: `Findmucker/casa-app` — use `git credential fill` to get token for API calls

## Architecture

### Key Files
| File | Purpose |
|------|---------|
| `app/page.tsx` | Entry point — auth gate, HouseProvider wrapper |
| `app/dashboard/DashboardClient.tsx` | Main dashboard — tabs, menu panel, overlays |
| `lib/auth.ts` | `useAuth()`, `useHouse()` (real-time listener), `HouseMember` type |
| `lib/context.tsx` | `HouseProvider`, `useHouseContext()` — houseId, userName, userId, members |
| `lib/hooks.ts` | `useCollection()` generic Firestore hook, shared types |
| `lib/themes.ts` | Time-based themes (morning/afternoon/dusk/night), `useTimeTheme()` |
| `lib/gamification.ts` | Points, levels, streaks, badges, inventory |
| `lib/i18n.tsx` | `useT()` hook, `LocaleProvider` |
| `lib/locales/pt.ts` | Portuguese translations — `LocaleKeys` type derived from here |
| `lib/locales/en.ts` | English translations — must have same keys as pt.ts |
| `app/globals.css` | Global styles, animations, glassmorphism, night mode |

### Firestore Collections
| Collection | Key by | Purpose |
|-----------|--------|---------|
| `houses/{id}` | auto-ID | House data, members array |
| `gamification/{memberName}` | display name | Points, level, badges, avatar, inventory |
| `fcm_tokens/{memberName}` | display name | Push notification tokens |
| `users/{uid}` | Firebase UID | User profile |
| `shopping`, `priorities_small`, `priorities_big`, `habits`, `habit_checks`, `expenses`, `events`, `income`, `savings_goals` | auto-ID | App data collections |

### Component Patterns
- Full-screen overlays: `fixed inset-0 z-50 overflow-y-auto animate-fade-in-up`
- Cards: `bg-white/70` with global glassmorphism (`backdrop-filter: blur(8px)`)
- Buttons: `rounded-2xl active:scale-95 transition-all`
- Color scheme: rose/pink (light), purple (dark/night mode)
- All components use `useT()` for translations

## Workflows

### Task & Branch Workflow (MANDATORY for all work)
Every feature, bugfix, or change — no matter how small — MUST follow this flow:
1. **Create a GitHub issue** (even if trivial — close it immediately after merging)
2. **Create a branch** from master: `git checkout -b feat/short-name` or `fix/short-name`
3. Do the work, commit(s) on the branch
4. Push branch: `git push -u origin <branch>`
5. Merge to master (PR or fast-forward merge) and delete the branch
6. Close the GitHub issue with a reference to the commit/PR

Branch naming:
- `feat/description` — new features
- `fix/description` — bug fixes
- `style/description` — visual/CSS changes
- `chore/description` — maintenance, docs, config

### Adding a Feature
1. Follow the **Task & Branch Workflow** above (issue + branch)
2. Add i18n keys to `lib/locales/pt.ts` first (defines the type), then `en.ts`
3. Create/modify component in `components/`
4. Wire into `DashboardClient.tsx` (state + overlay render)
5. Run `npx tsc --noEmit`
6. Commit with conventional commit message + `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
7. Merge branch to master (auto-deploys to Vercel)

### Adding i18n Keys
- Add to `lib/locales/pt.ts` — the `LocaleKeys` type is `keyof typeof pt`
- Add same key to `lib/locales/en.ts`
- Use via `const { t } = useT(); t("key.name")`

### Creating GitHub Issues
```bash
# Get token
TOKEN=$(git credential fill <<< "protocol=https
host=github.com
" 2>/dev/null | grep password | cut -d= -f2)

# Create issue
curl -s -X POST "https://api.github.com/repos/Findmucker/casa-app/issues" \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"title":"...","labels":["enhancement"],"body":"..."}'
```

### Updating Docs
After feature work, update: `README.md`, `CHANGELOG.md`, `docs/USER_MANUAL.md`, `components/Tutorial.tsx` (+ i18n keys for tutorial steps)

## Design Principles

1. **Equality**: No admin hierarchy — all house members are equal. Members can only remove themselves.
2. **Fofinho aesthetic**: Soft gradients, rounded corners (2xl/3xl), glassmorphism, pink/rose/purple palette
3. **Time themes**: UI adapts to time of day (morning=warm amber, afternoon=rose/pink, dusk=orange/purple, night=light purple dimming)
4. **Night mode**: NOT dark — it's a subtle pastel dimming with `from-pink-100 via-purple-100 to-indigo-100`
5. **Animations**: `animate-fade-in-up` for entrances, staggered delays via `style={{ animationDelay }}`, `active:scale-95` for taps
6. **Mobile-first**: All interactions designed for touch, PWA installed on phones
7. **Real-time**: Use `onSnapshot` for live data, never stale reads for shared state

## Common Patterns

### Menu Panel Structure
```
Menu (click title) → Main panel:
  ├── Members widget (top, premium card, clickable avatars with actions)
  ├── Tabs grid (5 cols, all navigation tabs)
  ├── Category buttons (Communication, House, Settings → sub-panels)
```

### ProfilePage viewMember Pattern
```tsx
<ProfilePage onClose={...} viewMember={name} />
// viewMember=undefined → own profile (full edit)
// viewMember="Name" → read-only (no avatar/settings tabs)
```

### HouseMembers initialMessageTo Pattern
```tsx
<HouseMembers onClose={...} initialMessageTo={memberName} />
// Opens directly to that member's message panel
```

## Commit Style
- `feat:` new feature
- `fix:` bug fix
- `style:` visual/CSS changes
- `docs:` documentation
- `chore:` maintenance
- Always end with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## Known Gotchas
- `lib/locales/pt.ts` is the type source — always add keys there first
- Night mode is light-pastel, NOT dark — don't use dark backgrounds
- `useHouseContext()` must be inside `HouseProvider` (wraps at `app/page.tsx` level)
- Vercel uses `force-dynamic` on Firebase pages to avoid prerender
- Service worker: force update with `skipWaiting` + cache purge on every load
- Git on this machine uses CRLF (Windows) — warnings are normal
- **Firestore doc names are case-sensitive** — `gamification/{name}` uses display name (capitalized), but `useMemberNames()` returns lowercase keys. Always handle both cases.
- **MiniAvatar** generates a deterministic default avatar from the name when none is configured — never shows bare initials
- **AnimeAnimalCharacter** needs minimum ~16px to render pixel grid visibly (each pixel = size/16)
- **Two avatar systems**: `AvatarConfig` (animal pixel art, shown everywhere) vs `EquippedItems` (RPG loot, shown only in ProfilePage inventory). They are independent.
- **Always show issue URL to user before starting work** — let them review/edit scope first

## Avatar System Reference

### AvatarConfig (AnimeAnimalCharacter)
- Stored in: `gamification/{name}.avatar`
- Used in: MiniAvatar, HouseMembers, members widget, ProfilePage header
- Fields: animal, eyes, mouth, top, bottom, accessory, background, effect (all number indices)
- If not configured: MiniAvatar generates deterministic default from name

### EquippedItems (CharacterModel / RPG Loot)
- Stored in: `gamification/{name}.equipped`
- Used in: ProfilePage inventory tab, helmet badge on MiniAvatar
- Fields: helmet?, weapon?, shield?, armor?, boots?, accessory? (all item ID strings)
- LootSlot types and LOOT_POOL defined in `lib/gamification.ts`

### MiniAvatar Component (`components/MiniAvatar.tsx`)
- Props: `name` (member key, lowercase OK), `size` (px), `showEquipBadge` (default true)
- Tries Firestore lookup: capitalized name first, then lowercase
- Caches results per session (Map)
- Shows helmet emoji badge when size >= 28 and equipment exists
- Always renders pixel art (real or deterministic default) — never bare initials

## CI/CD & Deploy

### Deploy Pipeline
- **Trigger**: Every push to `master` auto-deploys via Vercel
- **Branch workflow**: Always work on a feature/fix branch, merge to master when ready
- **Verify after deploy**: Check Vercel dashboard or visit app URL

### Quality Gates (Before Push)
1. `npx tsc --noEmit` — TypeScript must pass with zero errors
2. Visual check of affected components (if possible)
3. No `console.log` left in production code (cleanup before commit)
4. i18n keys present in both `pt.ts` and `en.ts`
5. No hardcoded Portuguese in components — use `t("key")` 

### Code Review Checklist
- [ ] Types are correct (no `any`, no unsafe casts)
- [ ] i18n keys added to both locales
- [ ] Night mode compatibility (no dark backgrounds, use conditional classes with `darkMode`)
- [ ] Mobile-friendly (touch targets ≥44px, no hover-only interactions)
- [ ] Animations have `transition-all` or explicit duration
- [ ] Firestore reads are efficient (no unnecessary listeners)
- [ ] Component cleanup: useEffect returns unsubscribe functions for listeners

### Bug Analysis Process
1. Read the component code to understand current behavior
2. Check Firestore data model — is the data shape correct?
3. Check real-time listeners — is state going stale?
4. Check i18n — missing key causes silent empty string
5. Check night mode — does the UI break in dark state?
6. Test fix with `npx tsc --noEmit` before committing

### Refactoring Guidelines
- Extract shared logic into `lib/` hooks
- Keep components under ~300 lines — split if larger
- Use `useHouseContext()` instead of prop-drilling house data
- Prefer `useCollection()` generic hook for Firestore collections
- Move magic strings to i18n keys or constants

## GitHub Operations

### Access Pattern
```bash
# Get credentials (stored in Windows Credential Manager)
TOKEN=$(git credential fill <<< "protocol=https
host=github.com
" 2>/dev/null | grep password | cut -d= -f2)
```

### Issue Management
```bash
# List open issues (never show closed issues unless explicitly asked)
curl -s "https://api.github.com/repos/Findmucker/casa-app/issues?state=open&sort=created&direction=desc" \
  -H "Authorization: token $TOKEN" | python3 -c "import json,sys;[print(f'#{i[\"number\"]} {i[\"title\"]}') for i in json.load(sys.stdin)]"

# Create issue
curl -s -X POST "https://api.github.com/repos/Findmucker/casa-app/issues" \
  -H "Authorization: token $TOKEN" -d '{"title":"...","labels":["enhancement"],"body":"..."}'

# Close issue
curl -s -X PATCH "https://api.github.com/repos/Findmucker/casa-app/issues/NUMBER" \
  -H "Authorization: token $TOKEN" -d '{"state":"closed"}'

# Add labels
curl -s -X POST "https://api.github.com/repos/Findmucker/casa-app/issues/NUMBER/labels" \
  -H "Authorization: token $TOKEN" -d '{"labels":["bug","priority: high"]}'
```

### PR Workflow (when using branches)
```bash
git checkout -b feature/name
# ... work ...
git push -u origin feature/name
# Create PR via curl or gh
```

## Testing Strategy

### Current (Manual)
- `npx tsc --noEmit` — type safety gate
- Visual testing on mobile PWA after deploy
- Test all 4 time themes (change system clock or wait)

### Recommended Checks Before Commit
1. TypeScript compiles: `npx tsc --noEmit`
2. No unused imports (TS will catch most)
3. Test the specific flow changed (menu, profile, members, etc.)
4. Verify in night mode if touching theme-dependent code

## Documentation Update Checklist

After any feature/fix, update these files as needed:
- `README.md` — features list, architecture notes
- `CHANGELOG.md` — new version entry with date
- `docs/USER_MANUAL.md` — user-facing instructions
- `components/Tutorial.tsx` — in-app tutorial steps (+ i18n keys)
- `CONTRIBUTING.md` — if workflow changes
- `docs/BRANCHING_STRATEGY.md` — if git flow changes

## Issue Workflow

**IMPORTANT**: Before starting work on any issue, ALWAYS show the issue URL to the user first so they can review/edit it. Only begin implementation after they confirm.

```
Issue URL: https://github.com/Findmucker/casa-app/issues/{NUMBER}
```

Wait for user approval before coding.

