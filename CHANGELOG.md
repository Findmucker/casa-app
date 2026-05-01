# Changelog

All notable changes to this project will be documented in this file.

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
- **Habit assignee** - assign habits to specific house members
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
- **Multi-tenant architecture** - each house has isolated data
- **Invite system** - generate 6-char codes, share via link
- **House setup flow** - create house or join existing via invite
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
- **Rotinazinhas** (Habits) - daily check with streak, push notifications
- **Gastinhos** (Expenses) - monthly tracking by person and category
- **Receitinhas** (Meal Planner) - weekly view, send ingredients to shopping
- **Calendarzinho** - monthly grid with dots from all collections
- **Dashboard Summary** - overview cards + weekly progress
- **Gamification** - points, levels, 9 badges
- **Search Overlay** - global search across all tabs
- **History Panel** - completed items with dates
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
