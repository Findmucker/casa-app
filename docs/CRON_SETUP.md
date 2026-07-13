# Habit Reminder Operations

The reminder endpoint is designed for schedulers that may run late or invoke the
same job more than once. GitHub Actions is the primary scheduler; Vercel's daily
cron is a fallback.

## Architecture

```
GitHub Actions (every 5 min) ──→ /api/cron/habits
Vercel cron (daily at 08:00 UTC) ──→ /api/cron/habits (fallback)
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

### 4. Configure reminder behavior

Set `REMINDER_TIME_ZONE=Europe/Lisbon` and `REMINDER_WINDOW_MINUTES=180` in
Vercel. The recovery window allows a delayed scheduler run to deliver a reminder
that was due earlier without sending it twice.

## How it works

The endpoint checks all houses for habits with:
- A configured `reminderTime`
- Current local time within the configured recovery window
- Today is an active day
- Habit not yet checked today

Before sending, the endpoint acquires a five-minute Firestore lease in
`notification_deliveries`. Successful deliveries are permanently marked `sent`
for that habit, member, and local date. Invalid FCM tokens are removed.

## Verifying

- GitHub Actions: check Actions tab → "Habit Reminders Cron" workflow
- Endpoint returns diagnostic counters such as `sent`, `deduplicated`,
  `missingTokens`, `invalidTokens`, `failed`, and `unmatchedAssignees`.
- A healthy second invocation for the same occurrence reports `sent: 0` and a
  positive `deduplicated` count.

## Failure handling

- A non-200 response or `{ "ok": false }` fails the GitHub Actions run.
- Inspect the `Habit Reminders Cron` workflow log for the safe JSON response.
- Confirm `APP_URL` and `CRON_SECRET` exist as GitHub Actions secrets.
- Confirm Firebase Admin credentials and `CRON_SECRET` exist in Vercel.
- Never log authorization headers, service-account keys, or full FCM tokens.
