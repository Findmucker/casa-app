# A Nossa Casinha

A household management PWA for couples — organize shopping, tasks, projects, habits, expenses, meals, events, and more. Built with love.

**Live:** [casa-app-zeta.vercel.app](https://casa-app-zeta.vercel.app)

**Version:** 0.7.0

## Features

### Shopping List (Comprinhas)
- Add/remove items with estimated price
- Assign to house member or "Both"
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
- **Person filter** — filter habits by house member
- Assign to person (dynamic by house members)
- **Repeating notifications** — reminder every 10 min until completed
- Push notifications via FCM

### Expenses (Gastinhos)
- **3 sub-tabs:** Despesas (expenses), Rendimentos (income), Poupanças (savings goals)
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

### Meal Planner (Receitinhas)
- Weekly view (7 days)
- Slots: Breakfast, Lunch, Dinner, Snack
- Send ingredients directly to Shopping List
- Autocomplete with past meals

### Calendar (Calendarzinho)
- Monthly grid with colored dots by type
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
- Persists in localStorage

### PWA & Push Notifications
- Full PWA with installable manifest
- Push notifications via Firebase Cloud Messaging (FCM)
- **Service worker with `skipWaiting` + cache purge** for reliable updates
- Repeating habit reminders (client-side, every 10 min)

### Send Message Panel
- Send push notification with message to other house members
- 8 predefined quick messages
- Custom message input

### Search Overlay
- Global search across all tabs (2+ characters)
- Results grouped by type

### Tutorial System
- Interactive step-by-step tutorial on first use
- Accessible anytime via menu

### House Member Management
- Invite system with 6-char codes and shareable links
- View members with avatar, level, and stats
- Dynamic member names throughout the app

### Profile with Avatar Customization
- 11 pixel art animals with unique idle animations
- 6 customization tabs (Animal, Eyes, Mouth, Top, Bottom, Accessories)
- Avatar displayed in profile header

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS
- **Database:** Firebase Firestore (real-time sync)
- **Auth:** Firebase Auth (email/password + Google)
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Weather:** Open-Meteo API (free, no API key)
- **Deploy:** Vercel (auto-deploy from GitHub)
- **CI/CD:** GitHub Actions (typecheck, lint, build, tests, PR validation)
- **Multi-tenant:** Each house has isolated data, invites by link

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/Findmucker/my_projects.git
cd my_projects
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

### 5. Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm run typecheck     # TypeScript type check
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
│   ├── Calendar.tsx          # Monthly calendar view
│   ├── EventList.tsx         # Events with weather
│   ├── Weather.tsx           # Weather forecast
│   ├── DashboardSummary.tsx  # Dashboard overview
│   ├── ProfilePage.tsx       # RPG profile + inventory + avatar
│   ├── AvatarBuilder.tsx     # 8-bit pixel art avatar
│   ├── Inventory.tsx         # WoW-style inventory grid
│   ├── LootBoxOpener.tsx     # Loot box opening animation
│   ├── Tutorial.tsx          # Interactive tutorial
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
| `houses/{houseId}` | House (name, members) |
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

Connected to Vercel via GitHub. Every push to `main` auto-deploys via CI/CD pipeline.

### CI/CD Pipeline (GitHub Actions)

On every PR:
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

## License

Personal project — made with love.
