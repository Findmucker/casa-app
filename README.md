# A Nossa Casinha

A household management PWA for couples and families — organize shopping, tasks, projects, habits, expenses, events, and more. Built with love.

**Live:** [casa-app-zeta.vercel.app](https://casa-app-zeta.vercel.app)

**Version:** 0.8.4

## Features

### Shopping List (Comprinhas)
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

### Projects (Projetinhos)
- Status workflow: Pending → In Progress → Done
- **Subtasks**, budget, detailed notes
- Auto-categorization (Painting, Construction, Doors/Windows, Electrical, Repairs, Plumbing, Kitchen, Exterior, Heating)
- Collapsible categories with state counters

### Habit Tracking (Rotinazinhas)
- Daily check that resets at midnight
- **Streak tracking** with fire animations
- **Weekday selector** — define which days a habit is active
- **Person filter** — filter habits by house member (no redundant "Ambos" button)
- Assign to person (dynamic by house members)
- **Repeating notifications** — reminder every 10 min until completed
- Push notifications via FCM

### Expenses (Gastinhos)
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

### Calendar (Calendarzinho)
- Monthly grid with **emoji indicators** by type (replaced colored dots)
- Portuguese holidays (fixed + Easter-based)
- Weather emoji integration (next 7 days)
- Event integration
- Tap day for details panel

### Events (Eventinhos)
- Create events with date and participants
- Shopping list and tasks per event
- Assign responsible members
- Auto weather forecast for upcoming events
- Share with friends via public link
- Clone past events

### Weather Widget
- 7-day forecast (Open-Meteo API)
- Temperature, wind, precipitation
- Expandable hourly view
- Integrated in Calendar and Events

### Dashboard Summary
- Cards with status from all areas
- Weekly progress bar
- Quick access to each section

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
- Push notifications via Firebase Cloud Messaging (FCM)
- **Service worker with `skipWaiting` + cache purge** for reliable updates
- Repeating habit reminders (client-side, every 10 min)

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

### Send Message Panel
- Send push notification with message to other house members
- Message accessible via Members widget (click member → 💌 Message)
- 8 predefined quick messages
- Custom message input

### Search Overlay
- Global search across all tabs (2+ characters)
- Results grouped by type

### Tutorial System
- Interactive step-by-step tutorial on first use
- **Fully rewritten** with updated content and full i18n support
- Accessible anytime via menu

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

## Branching Strategy

```
feature/* ──PR──► develop ──PR──► master
                    │                │
                    ▼                ▼
             Preview Deploy    Production Deploy
```

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

### 3. Firebase setup

1. Create project in [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication → Email/Password + Google
4. (Optional) Enable Cloud Messaging for push notifications

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
│   ├── api/cron/habits/      # Cron endpoint for habit reminders
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
│   ├── MealPlanner.tsx       # Weekly meal planner
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
│   ├── notifications.ts      # Push notifications + reminders
│   ├── categories.ts         # Categories + auto-classification
│   └── weather.ts            # WMO codes + weather helpers
└── public/
    ├── manifest.json         # PWA manifest
    └── sw.js                 # Service worker (skipWaiting + cache purge)
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
| `houses/{houseId}/meal_plans` | Meal plans by day |
| `houses/{houseId}/gamification` | Points, badges, stats |
| `gamification/{owner}` | RPG profile: inventory, equipped, avatar, lootBoxes |
| `fcm_tokens/{owner}` | FCM tokens for push notifications |

## Deploy

Connected to Vercel via GitHub with Firebase backend. Merges to `master` auto-deploy via CI/CD pipeline.

### CI/CD Pipeline (GitHub Actions)

On every PR — quality gates must pass:
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

Active issues are tracked at [GitHub Issues](https://github.com/Findmucker/casa-app/issues) (#88–#97 cover upcoming improvements).

## License

Personal project — made with love.
