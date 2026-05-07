# Cron Setup — External Services

The habit reminder system needs to run every 5–10 minutes. Vercel Hobby only supports daily cron, so we use external services.

## Architecture

```
GitHub Actions (every 10 min) ──→ /api/cron/habits
cron-job.org  (every 5 min)  ──→ /api/cron/habits   (backup)
Vercel cron   (daily 8am)    ──→ /api/cron/habits   (fallback)
```

All callers authenticate with `Authorization: Bearer <CRON_SECRET>`.

## Setup

### 1. Generate a secret

```bash
openssl rand -hex 32
```

### 2. Add to Vercel environment variables

- `CRON_SECRET` = the generated secret

### 3. Add to GitHub repository secrets

Go to Settings → Secrets and variables → Actions:
- `CRON_SECRET` = same secret
- `APP_URL` = `https://your-app.vercel.app` (no trailing slash)

### 4. Set up cron-job.org (backup)

1. Create free account at https://cron-job.org
2. Create a new cron job:
   - **URL**: `https://your-app.vercel.app/api/cron/habits`
   - **Schedule**: Every 5 minutes
   - **Request method**: GET
   - **Headers**: `Authorization: Bearer <your-secret>`
3. Enable notifications on failure (optional)

## How it works

The endpoint checks all houses for habits with:
- A configured `reminderTime`
- Current time within the reminder window (up to 2h after)
- Today is an active day
- Habit not yet checked today

It sends FCM push notifications (data-only) to the relevant members.

## Verifying

- GitHub Actions: check Actions tab → "Habit Reminders Cron" workflow
- cron-job.org: check execution history on their dashboard
- Endpoint returns: `{ ok: true, sent: N, timestamp: "..." }`
