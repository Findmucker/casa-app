# A Nossa Casinha

A household management PWA for couples and families — organize shopping, tasks, projects, habits, expenses, events, and more. Built with love.

**Live:** [casa-app-zeta.vercel.app](https://casa-app-zeta.vercel.app)

**Release model:** rolling deployment from `master` to production. See [CHANGELOG.md](CHANGELOG.md) for notable changes.

## Features

### Shopping List (Compras)
- Add/remove items with estimated price
- Assign to any house member
- Auto-categorization (Fresh, Meats, Fruits, Bakery, Pantry, Drinks, Snacks, Hygiene, Pets)
- Collapsible categories with progress bars
- Mark as urgent (pinned to top)
- Celebration animations on completion

### Priority/Task List (Coisinhas)
- Auto-categorization (House, Kitchen, Decor, Organization, DIY, Bathroom, Tech, Garden, Laundry, Tasks)
- **Drag reorder** for prioritization
- Assign to person + notes per item
- Collapsible categories with progress bars
- Autocomplete suggestions

### Projects (Projetos)
- Status workflow: Pending → In Progress → Done
- **Subtasks**, budget, detailed notes
- Auto-categorization (Painting, Construction, Doors/Windows, Electrical, Repairs, Plumbing, Kitchen, Exterior, Heating)
- Collapsible categories with state counters

### Habit Tracking (Rotinas)
- Daily check that resets at midnight
- **Streak tracking** with fire animations
- **Weekday selector** — define which days a habit is active
- **Person filter** — filter habits by house member (no redundant "Ambos" button)
- Assign to person (dynamic by house members)
- **Reliable notifications** — server-side reminders with delayed-run recovery and duplicate suppression
- Push notifications via FCM

### Finances (Finanças)
- **3 sub-tabs:** Despesas (expenses), Rendimentos (income), Poupancas (savings goals)
- Track: name, amount, category, who paid
- Monthly summary by category with visual bars
- Total per person + monthly navigation
- Split tracking between members
- **Visual charts** (pure SVG, no external deps):
  - Donut chart for category breakdown
  - Bar chart for 6-month spending history
  - Member split rings
- **Income tracking** — log income entries per member
- **Savings goals** — set targets with progress bars

### Calendar (Calendário)
- Monthly grid with **emoji indicators** by type (replaced colored dots)
- Portuguese holidays (fixed + Easter-based)
- **Member birthdays** with MiniAvatar pixel art on the grid
- Weather emoji integration (next 7 days)
- Event integration
- Tap day for details panel (MiniAvatar shown for birthdays)

### Events (Eventos)
- Create events with date and participants
- Shopping list and tasks per event
- Assign responsible members
- Auto weather forecast for upcoming events
- Share with friends via public link
- Public links expose only the selected event snapshot
- Clone past events

### Weather Widget
- 7-day forecast (Open-Meteo API)
- Device geolocation with an explicit Óbidos fallback when permission is unavailable
- Temperature, wind, precipitation
- Expandable hourly view
- Integrated in Calendar and Events

### Dashboard Summary
- Cards with status from all areas
- Weekly progress bar

### Gamification & RPG Profile
- Points system (+1 shopping, +2 task, +5 project, +2 habit)
- Levels (every 50 points) with progressive titles
- 9 unlockable badges
- RPG profile with 6 stats based on real activity
- Loot boxes with cosmetic items (4 rarities)
- WoW TBC-style inventory with drag-and-drop
- 8-bit pixel art avatar with full customization (11 animals, 6 customization tabs)

### i18n (Internationalization)
- Portuguese and English support
- `LocaleProvider` + `useT()` hook architecture
- Locale dictionaries in `lib/locales/pt.ts` and `lib/locales/en.ts`
- Language toggle on login screen and dashboard menu
- **Tutorial fully localized** with i18n support
- Persists in localStorage

### PWA & Push Notifications
- Full PWA with installable manifest
- **Back button navigation** — device/browser back closes panels instead of leaving the app
- Push notifications via Firebase Cloud Messaging (FCM) using **data-only messages** (no duplicates)
- **Service worker with `skipWaiting` + cache purge** for reliable updates
- **Smart notification routing** — tapping a notification opens the correct tab automatically
- Foreground client reminders as a best-effort fallback to the server scheduler
- **In-app Help panel** with notification permission status debug
- **Smart notifications** for key actions:
  - 🔥 Urgent shopping items
  - 🎉 New events created
  - 📅 Event tomorrow reminder (8am cron)
  - 🎂 Birthday notifications (8am cron)
  - 🏠 Friend request sent/accepted
  - 👋 New member joined house
  - 💌 Direct messages between members

### Member Management
- Invite system with 6-char codes and shareable links
- **Flat hierarchy** — all members are equal (no admin roles)
- **Members widget in menu** — shows member avatars with level, clickable for actions
- Action buttons: 💌 Message (opens direct message panel) and 👤 Profile (view profile)
- Viewing another member's profile shows read-only view (no settings tab)
- Viewing your own profile shows full editable profile
- Members can only leave themselves (no removing others)
- **Animations** — staggered entrance, bounce on selected, hover scale
- Dynamic member names throughout the app
- **Customizable house name** — rename from menu, syncs in real-time

### Friends (Vizinhos)
- Connect houses via **6-char invite code** or **search by name**
- Send/accept/reject friend requests
- View friend houses list with **member avatar cards** (pixel art, like the menu members widget)
- Remove friend houses
- Search results show member names
- Bidirectional friendship (both houses see each other)

### Navigation
- **Back button support** — device/browser back closes the topmost panel instead of leaving the app
- **Profile button** — user's MiniAvatar pixel art in the header (top right)

### Send Message Panel
- Send push notification with message to other house members
- Message accessible via Members widget (click member → 💌 Message)
- 8 predefined quick messages
- Custom message input

### Search Overlay
- Global search across all tabs (2+ characters)
- Results grouped by type

### Tutorial System
- **Per-tab contextual tips** — dismissible tips shown on first visit to each tab
- Tips stored in localStorage per tab ID

### Profile with Avatar Customization
- 11 pixel art animals with unique idle animations
- 6 customization tabs (Animal, Eyes, Mouth, Top, Bottom, Accessories)
- Avatar displayed in profile header
- **MiniAvatar** with deterministic pixel art default (based on name) — used in person filters and assignee selectors
- **Equipment sync** — helmet badge shown on MiniAvatar and members widget when equipped
- **CharacterModel** shows cute placeholder when no equipment (instead of generic silhouette)
- Profile shows initial letter circle when no avatar and no equipment configured

## Tech Stack

- **Framework:** Next.js 16 (App Router, `force-dynamic` for Firebase pages)
- **Language:** TypeScript
- **UI:** Tailwind CSS
- **Database:** Firebase Firestore (real-time sync)
- **Auth:** Firebase Auth (email/password + Google)
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Weather:** Open-Meteo API (free, no API key)
- **Deploy:** Vercel (auto-deploy from GitHub) + Firebase
- **CI/CD:** GitHub Actions with quality gates (typecheck, lint, build, tests, PR validation)
- **Multi-tenant:** Each house has isolated data, invites by link

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for runtime boundaries, data
ownership, and notification flow.

## Branching Strategy

Create a short-lived working branch from `master`, open a pull request back to
`master`, and merge only after the quality gates pass.

See [docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md) for full details.

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/Findmucker/casa-app.git
cd casa-app
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Copy the complete template from [`.env.local.example`](.env.local.example). Server-side
notifications also require Firebase Admin credentials, `CRON_SECRET`, and the FCM
VAPID key. Never commit real credentials.

### 3. Firebase setup

1. Create project in [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication → Email/Password + Google
4. In Authentication → Settings → Authorized domains, add every domain that will serve the app (for example `localhost`, your Vercel preview/production domains, and any custom domain)
5. (Optional) Enable Cloud Messaging for push notifications

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Quality checks

```bash
npm run typecheck     # TypeScript type check
npm run lint          # ESLint
npm run build         # Build verification
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Project Structure

```
casa-app/
├── app/
│   ├── page.tsx              # Entry: Auth → House Setup → Dashboard
│   ├── dashboard/page.tsx    # Main dashboard with all tabs
│   ├── convite/[code]/       # Public invite acceptance page
│   ├── api/send-notification/ # POST endpoint for FCM push
│   ├── api/cron/habits/      # Authenticated, idempotent reminder endpoint
│   └── globals.css           # Animations and global styles
├── components/
│   ├── AuthScreen.tsx        # Login/register (email + Google)
│   ├── HouseSetup.tsx        # Create house or accept invite
│   ├── ShoppingList.tsx      # Shopping list with categories
│   ├── PriorityList.tsx      # Tasks with drag reorder
│   ├── ProjectList.tsx       # Projects with subtasks
│   ├── HabitList.tsx         # Habits with streaks and filters
│   ├── ExpenseList.tsx       # Expense tracking (3 sub-tabs)
│   ├── ExpenseCharts.tsx     # SVG donut, bar chart, split rings
│   ├── Calendar.tsx          # Monthly calendar with emojis
│   ├── EventList.tsx         # Events with weather
│   ├── Weather.tsx           # Weather forecast
│   ├── DashboardSummary.tsx  # Dashboard overview
│   ├── ProfilePage.tsx       # RPG profile + inventory + avatar
│   ├── AvatarBuilder.tsx     # 8-bit pixel art avatar
│   ├── Inventory.tsx         # WoW-style inventory grid
│   ├── LootBoxOpener.tsx     # Loot box opening animation
│   ├── Tutorial.tsx          # Interactive tutorial (i18n)
│   ├── SearchOverlay.tsx     # Global search
│   ├── SendMessagePanel.tsx  # Send push message to members
│   └── ...
├── lib/
│   ├── firebase.ts           # Firebase config + Auth
│   ├── i18n.tsx              # LocaleProvider + useT hook
│   ├── locales/
│   │   ├── pt.ts             # Portuguese dictionary
│   │   └── en.ts             # English dictionary
│   ├── gamification.ts       # Points, badges, loot, inventory
│   ├── notifications.ts      # FCM registration and client notification helpers
│   ├── habit-reminder-time.ts # Lisbon-time reminder occurrence calculation
│   ├── categories.ts         # Categories + auto-classification
│   └── weather.ts            # WMO codes + weather helpers
└── public/
    ├── manifest.json         # PWA manifest
    └── firebase-messaging-sw.js # Firebase messaging service worker
```

## Firestore Collections

| Collection | Description |
|---|---|
| `users/{uid}` | User profile (name, email, houseId) |
| `houses/{houseId}` | House (name, members — all equal, no admin hierarchy) |
| `invites/{code}` | Pending invites |
| `houses/{houseId}/shopping` | Shopping list items |
| `houses/{houseId}/priorities_small` | Tasks (coisinhas) |
| `houses/{houseId}/priorities_big` | Projects |
| `houses/{houseId}/events` | Events |
| `houses/{houseId}/habits` | Habit configurations |
| `houses/{houseId}/habit_checks` | Daily habit checks |
| `houses/{houseId}/expenses` | Expenses |
| `houses/{houseId}/income` | Income entries |
| `houses/{houseId}/savings_goals` | Savings goals with targets |
| `houses/{houseId}/friends/{id}` | Friend house connections |
| `houses/{houseId}/gamification` | Points, badges, stats |
| `gamification/{owner}` | RPG profile: inventory, equipped, avatar, lootBoxes |
| `fcm_tokens/{owner}` | FCM tokens for push notifications |
| `notification_deliveries/{id}` | Reminder leases and delivery deduplication |

## Deploy

Connected to Vercel via GitHub with Firebase as the backend. Updates to `master`
deploy automatically. GitHub Actions runs the reminder scheduler; Vercel's daily
cron remains a fallback. See [docs/CRON_SETUP.md](docs/CRON_SETUP.md).

### CI/CD Pipeline (GitHub Actions)

On every pull request to `master` and every push to `master`:
- TypeScript typecheck
- ESLint
- Build verification
- Test suite
- PR title validation (conventional commits)
- Branch naming check
- Auto-labeling
- PR stats comment

```bash
# Manual deploy (if needed)
npx vercel --prod
```

## GitHub Issues

Active bugs and planned improvements are tracked in [GitHub Issues](https://github.com/Findmucker/casa-app/issues).

## License

Personal project — made with love.
