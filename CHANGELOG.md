# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Product, architecture, Android, service-cost, and backlog review documentation.

### Fixed
- Finance donuts now render a complete ring for single-category months.
- Finance charts consistently ignore invalid, non-finite, and non-positive amounts.
- Coisinhas can now include notes during creation, with a compact mobile-friendly price field.
- Finance charts no longer render phantom bars for months without expenses or income.
- Portuguese bank statements now parse European amounts, dates, and duplicates more reliably.

### Changed
- The open backlog was consolidated from 36 issues to 13 focused roadmap items.
- The platform direction remains PWA-first; Android work is limited to a future Capacitor widget pilot.
- Paid/external AI generation proposals were replaced by local deterministic templates.
- Finance charts now share pure calculations, localized labels, stable keys, and accessible descriptions.
- Manual finance entries, savings targets, and deposits now require positive amounts.
- The calendar no longer shows Coisinhas completed on each day.
- Bank statement imports now process CSV and text-based PDFs locally in the browser;
  image uploads and external AI processing were removed.
- Habit reminders now use Lisbon local time, a delayed-run recovery window, and
  Firestore-backed delivery deduplication.
- Invalid FCM tokens are removed automatically and cron responses expose diagnostic
  counters for operations.
- CI now validates the actual production branch, `master`.
- Contributor, branching, architecture, and cron documentation now match the live
  deployment model.
- Weather forecasts use the device's current coordinates when permission is granted;
  the Óbidos fallback is now identified explicitly.
- Event links contain a public snapshot of only the selected event and its items,
  instead of attempting to expose the house event collection.

### Fixed
- Google sign-in reconciles an existing same-email profile and preserves house data.
- Swipe actions on list rows no longer propagate to dashboard tab navigation.
- Failed habit creation remains visible and surfaces the Firestore error instead of
  silently closing the form.
- Optional Firestore fields are omitted on create and deleted explicitly on update,
  preventing writes from failing on unsupported `undefined` values.
- Event sharing now opens the event that was selected rather than a house-wide view.

## [0.8.7] - 2026-05-05

### Added
- **Friend house member avatars** — Vizinhos panel now shows member avatar cards for each friend house (like the menu members widget)
- **friends.noMembers i18n key** — shown when a friend house has no visible members
- **Smart notification routing** — tapping a notification opens the correct tab (e.g., shopping, events, habits)
- **In-app Help panel** — includes notification permission status debug info
- **useHouseContextSafe() hook** — safe version of useHouseContext for components outside HouseProvider
- **SendMessagePanel full i18n** — all strings now localized (PT/EN)
- **Back button navigation** — overlays push history state and close via popstate; menu→overlay uses replaceState for clean UX

### Fixed
- **Duplicate push notifications** — switched to data-only FCM messages to prevent system tray duplicates
- **Notification click "cannot be loaded"** — service worker now uses absolute URLs for notification click targets

### Changed
- **Service worker bumped to v0.8.6** — includes absolute URL fix and data-only message handling

### Removed
- **Maintenance panel** — removed from Settings sub-panel (data migration no longer needed)

## [0.8.6] - 2026-05-04

### Added
- **Push notifications for key actions** — urgent shopping items, new events, friend requests, member joined house
- **Event tomorrow reminders** — cron sends push at 8am for next-day events
- **Birthday notifications** — cron sends push at 8am on member birthdays
- **Friend request notifications** — push when request sent and when accepted
- **Periodic background sync** — service worker self-triggers habit cron every 10min (Android/Chrome)
- **notifyOtherMembers helper** — reusable push notification utility in lib/notifications

### Changed
- **Cron schedule** — upgraded from daily to hourly for more reliable habit reminders
- **Service worker** — bumped to v0.8.5, added fetch piggyback for cron self-trigger
- **Calendar emoji extraction** — fixed regex that failed on flags/VS16 emojis (🇵🇹, ✝️, 🛡️)
- **Calendar habit dots** — now show each habit's custom emoji instead of hardcoded 🧘
- **Calendar day details** — emoji shown as separate icon, no duplicate in label text
- **Calendar legend** — holidays icon changed from 📅 to 🎆

### Fixed
- **Holiday emojis not showing** — regex `Emoji_Presentation` doesn't match flags/text+VS16; switched to split
- **Calendar detail duplicate emojis** — labels had emoji prefix AND separate emoji rendering

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
  - Settings (Tutorial, Language toggle)
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
