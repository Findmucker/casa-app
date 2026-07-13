# Architecture

## Runtime boundaries

- The Next.js App Router hosts the client PWA and authenticated route handlers.
- Firebase Authentication owns user identity; Firestore stores house-scoped data.
- Firebase Admin runs only in server route handlers and sends FCM notifications.
- GitHub Actions schedules habit reminders. Vercel hosts the endpoint and provides
  a daily fallback invocation.

## Data ownership

User profiles live at `users/{uid}`. Household data belongs under
`houses/{houseId}` and its subcollections. A signed-in user may access a house only
when their UID is present in that house's member list. Public event access uses a
share document rather than exposing arbitrary house IDs.

New event-share documents contain a read-only snapshot of the selected event and
its items. Public pages never query the private `houses/{houseId}/events` collection.

## Client data flow

`HouseIdContext` identifies the active tenant. `useCollection` creates real-time
Firestore listeners and exposes loading and error state to feature components.
Dashboard collection data is shared through `CollectionDataContext` where possible
to avoid duplicate listeners.

## Notification flow

1. The browser registers an FCM token under the authenticated user's UID.
2. A scheduler calls `/api/cron/habits` with `Authorization: Bearer CRON_SECRET`.
3. The route calculates due occurrences in `Europe/Lisbon`.
4. A Firestore delivery record leases and deduplicates each recipient occurrence.
5. Firebase Admin sends the data-only FCM message and removes invalid tokens.

Operational details are in [CRON_SETUP.md](CRON_SETUP.md). Security policy is
enforced by [../firestore.rules](../firestore.rules).

## Change guidelines

- Keep Firebase Admin and secrets out of client modules.
- Preserve house scoping for every new collection and query.
- Put user-visible text in both locale dictionaries.
- Prefer small pure helpers for date, categorization, and calculation logic; cover
  them with unit tests.
- Route-handler changes must follow the documentation bundled with the installed
  Next.js version in `node_modules/next/dist/docs`.
