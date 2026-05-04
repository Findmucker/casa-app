# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.5] - 2026-05-04

### Added
- **Friends system** — connect houses via 6-char invite code, search by name, send/accept/reject requests
- **FriendsPanel** — full-screen overlay with friend list, code generation, and search with member previews
- **Customizable house name** — rename house from menu settings, displayed dynamically in header and friends
- **Per-tab contextual tips** — replaced global tutorial with dismissible tips on first visit to each tab

### Changed
- **Tab names** — removed diminutive suffixes (Projetinhos → Projetos, Gastinhos → Finanças, etc.)
- **Tab icons** — updated carousel emojis for better clarity
- **Dashboard** — removed quick access section for cleaner home screen

### Removed
- **Global tutorial** — replaced by per-tab contextual tips (Tutorial.tsx kept as reference)

## [0.8.4] - 2026-05-04

### Removed
- **Receitinhas (Meal Planner)** — removed feature entirely (component, i18n, tutorial, docs)

### Changed
- **Branch workflow** — all changes now require GitHub issue + feature branch before merging to master
- **Issue housekeeping** — created epics (#102-#106), added acceptance criteria to all actionable issues

## [0.8.3] - 2026-05-03

### Added
- **Push notifications cron** — Vercel cron job runs 6x/day (7h, 9h, 12h, 15h, 18h, 21h) to send real FCM push notifications for unchecked habits
- **Error state in HabitList** — shows actual Firestore error message when data fails to load
- **Error state in useCollection** — generic hook now exposes `error` field

### Changed
- **Menu layout** — Communication button removed, History moved into Settings sub-panel
- **Holiday icons** — each holiday now shows its own emoji (🔴 Liberty Day, 📜 Republic, 🛡️ Independence) instead of all using 🇵🇹
- **Category buttons** — 2 columns: House | Settings

### Fixed
- **Calendar holidays** — correct per-holiday emojis, 🇵🇹 only for Dia de Portugal

## [0.8.2] - 2026-05-02

### Added
- **MiniAvatar in person filters and assignee selectors** — pixel art avatars now shown in HabitList, ExpenseList, and PriorityList person filters
- **Deterministic default avatar** — MiniAvatar always shows pixel art based on member name when no avatar is configured
- **CharacterModel cute placeholder** — shows a cute placeholder when no equipment is equipped instead of a generic silhouette
- **ProfilePage initial letter circle** — displays a letter circle when member has no avatar AND no equipment
- **Equipment helmet badge** — MiniAvatar and members widget show a helmet badge when equipment is equipped

### Changed
- **ProfilePage viewMember** — now correctly loads the viewed member's equipment data
- **InventoryTab read-only for other members** — viewing another member's profile no longer shows loot boxes

### Fixed
- **MiniAvatar case-sensitivity** — tries capitalized name then lowercase for Firestore lookup, with fallback (#95)
- **Equipment sync across app** — equipped data now loaded consistently in MiniAvatar, widget, and profile (#95)

## [0.8.1] - 2026-05-02

### Added
- **Members widget in menu panel** — shows member avatars with level, clickable for actions (💌 Message / 👤 Profile)
- **Direct message from member** — clicking 💌 Message on a member opens their message panel directly
- **Read-only profile view** — clicking 👤 Profile on another member shows their profile without settings tab
- **Self profile shortcut** — clicking 👤 Profile on yourself opens your full editable profile
- **Members widget animations** — staggered entrance, bounce on selected member, hover scale

### Changed
- **💌 Message removed from Communication sub-panel** — only 📜 History remains; messaging now accessed via Members widget
- **Members can only leave themselves** — removed ability to remove other members

## [0.8.0] - 2026-05-02

### Added
- **Calendar emoji indicators** — replaced colored dots with emojis for better visual clarity (#86)
- **Member management** — view all house members with avatar, level, and stats
- **Tutorial rewritten** — fully updated content with complete i18n support (PT/EN)
- **GitHub Issues #88–#97** — created tracking issues for upcoming improvements

### Changed
- **Member hierarchy removed** — all house members are now equal (no admin roles)
- **Rotinazinhas emoji** — changed section icon from 💊 to 🧘 (better represents daily routines/well-being)
- **Next.js upgraded to 16** — App Router with `force-dynamic` for Firebase pages
- **Branching strategy** — standardized `feature/* → develop → master` flow
- **Vercel deployment** now uses Firebase backend with force-dynamic rendering

### Fixed
- **Habits filter** — removed redundant "Ambos" button from person filter (#93)

## [0.7.0] - 2026-05-02

### Added
- **Gastinhos restructured with 3 sub-tabs:** Despesas, Rendimentos, Poupancas (#36)
- **Visual charts** — pure SVG, no external dependencies (#37):
  - Donut chart for category breakdown
  - Bar chart for 6-month spending history
  - Member split rings
- **Income tracking** — new `IncomeItem` type + Firestore `income` collection
- **Savings goals** — new `SavingsGoal` type + Firestore `savings_goals` collection with progress bars
- **ExpenseCharts component** — reusable SVG chart component
- **CI/CD pipeline** with GitHub Actions:
  - TypeScript typecheck
  - ESLint
  - Build verification
  - Test suite
- **PR validation workflows:**
  - Conventional commits title check
  - Branch naming validation
  - Auto-labeling
  - PR stats comment
- **Branching strategy** — develop → master flow with feature branches
- **CONTRIBUTING.md** guide for contributors
- **Issue templates** — bug report and feature request
- **PR template** for consistent pull requests
- **docs/BRANCHING_STRATEGY.md** — full workflow documentation

### Changed
- Dashboard forced to dynamic rendering to fix Vercel prerender Firebase error
- Environment variables added to Vercel Preview environment

### Fixed
- Vercel prerender error caused by Firebase client SDK in static page

## [0.6.0] - 2026-05-02

### Added
- **English localization (i18n)** — full PT/EN support with toggle
  - `LocaleProvider` + `useT()` hook architecture
  - Locale dictionaries (`lib/locales/pt.ts`, `lib/locales/en.ts`)
  - Language toggle on login screen (first-time users)
  - Inline PT/EN toggle in dashboard menu
  - Strings translated in: ShoppingList, HabitList, PriorityList, ProjectList, ExpenseList, SearchOverlay
  - Persists choice in localStorage
- **Habits: weekday selector** — choose which days a habit is active
- **Habits: person filter** — filter habits by member (like tasks tab)
- **Habits: repeating notifications** — reminder every 10 min until completed (client-side)
- **Menu restructured** into categorized sections:
  - Communication (Message, History)
  - House (Invite, Members)
  - Settings (Maintenance, Tutorial, Language toggle)
- **Profile name sync** — changing name propagates to house members, gamification, and FCM tokens

### Changed
- Removed "Pilula" from default habits and all references
- Empty habits page shows generic sparkle instead of pill emoji
- Dashboard wrapped in `LocaleProvider` for standalone route support
- Tabs built dynamically from locale keys

### Fixed
- FCM token key mismatch (was "shared", now per-user by lowercase name)
- ESLint 48→0 problems (conditional hooks, unused vars, etc.)
- Profile name not syncing across house members collection
- Vercel cron `*/10` rejected on Hobby plan (changed to daily + client-side repeat)

## [0.5.0] - 2026-05-01

### Added
- **RPG Profile Page** with WoW-style paper doll equipment layout
  - 6 stats (STR, INT, DEX, CHA, VIT, LCK) based on real activity
  - 6 unlockable equipment slots with rarity tiers (common/rare/epic/legendary)
  - Tap-to-show tooltips with item details
  - Level, XP bar, and progressive titles
- **Loot System** with random drops on task completion
  - Rarity-based drop chances (40% common, 20% rare, 10% epic, 5% legendary)
  - Bonus XP from loot drops
- **Level-up detection** with equipment unlocks on milestone levels
- **Interactive Tutorial** shown on first visit, accessible from menu
- **Portuguese Holidays** in Calendar (fixed + Easter-based calculations)
- **Expand/Collapse All** button on category lists (Shopping, Coisinhas, Projects)
- **Habit assignee** — assign habits to specific house members
- **Test suite** with Jest (gamification + categories coverage)

### Changed
- Profile button icon from trophy to sword (RPG theme)
- Member names are now dynamic (adapts to house members instead of hardcoded)
- Greeting uses authenticated user name
- Events page uses generic welcome message

### Fixed
- Removed hardcoded "Eduardo/Moniquinha" references throughout the app
- Type definitions now use `string` for assignee/paidBy (flexible for any house)

## [0.4.0] - 2026-04-30

### Added
- **Multi-user Firebase Auth** (email/password + Google sign-in)
- **Multi-tenant architecture** — each house has isolated data
- **Invite system** — generate 6-char codes, share via link
- **House setup flow** — create house or join existing via invite
- **Data migration** button in Maintenance panel
- **Dark mode** with auto sunrise/sunset detection (Open-Meteo API)
- Dark mode animation variants (purple/orange glows)

### Changed
- Replaced PIN auth with Firebase Auth
- All data scoped to `houses/{houseId}/` subcollections
- HouseIdContext provides multi-tenant isolation

### Removed
- PinScreen component
- OwnerPicker component
- usePin hook

## [0.3.0] - 2026-04-29

### Added
- **Rotinazinhas** (Habits) — daily check with streak, push notifications
- **Gastinhos** (Expenses) — monthly tracking by person and category
- **Calendarzinho** — monthly grid with dots from all collections
- **Dashboard Summary** — overview cards + weekly progress
- **Gamification** — points, levels, 9 badges
- **Search Overlay** — global search across all tabs
- **History Panel** — completed items with dates
- **Swipe navigation** between tabs
- **Micro-animations** (celebrate, spring-in, fade-out, streak-fire)
- Tab carousel auto-scrolls to active tab

## [0.2.0] - 2026-04-28

### Added
- **Auto-categorization** for Shopping, Coisinhas, and Projects
- Collapsible category sections with progress bars
- Category celebration animations on completion
- Urgent items section (pinned to top)
- Assignee picker (cycle through members)
- Notes per item
- Autocomplete suggestions

## [0.1.0] - 2026-04-27

### Added
- Initial app with Shopping List, Priority List, Project List
- Firebase Firestore real-time sync
- Basic PWA manifest
- Vercel deployment
