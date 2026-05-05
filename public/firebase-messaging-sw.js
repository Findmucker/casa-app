// v0.8.6 — fix duplicate notifications + click routing
const CACHE_VERSION = "v0.8.6";

importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDFijQyeFuPj4L2sjrojXaMf4yBoMvApho",
  authDomain: "casa-66668.firebaseapp.com",
  projectId: "casa-66668",
  storageBucket: "casa-66668.firebasestorage.app",
  messagingSenderId: "776757654663",
  appId: "1:776757654663:web:15c0fa42ae1815d43ff422",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Data-only messages: title/body are in payload.data
  const data = payload.data || {};
  const title = data.title || payload.notification?.title;
  const body = data.body || payload.notification?.body || "";
  if (!title) return;

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "casinha-" + Date.now(),
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Route to the correct tab based on notification tag
  const tag = event.notification.tag || "";
  let path = "/dashboard";
  if (tag.startsWith("habit-")) path = "/dashboard?tab=habits";
  else if (tag === "message") path = "/dashboard?tab=dashboard";
  else if (tag === "urgent-shopping") path = "/dashboard?tab=shopping";
  else if (tag === "new-event" || tag.startsWith("event-reminder")) path = "/dashboard?tab=events";
  else if (tag.startsWith("birthday-")) path = "/dashboard?tab=calendar";
  else if (tag === "friend-request" || tag === "friend-accepted") path = "/dashboard?tab=dashboard";
  else if (tag === "member-joined") path = "/dashboard?tab=dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.focus();
          client.postMessage({ type: "NOTIFICATION_CLICK", path, tag });
          return;
        }
      }
      // Otherwise open new window with full URL
      return clients.openWindow(new URL(path, self.location.origin).href);
    })
  );
});

// Force activate new service worker immediately (skip waiting)
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Periodic background sync — triggers habit cron every 10 min (Android/Chrome only)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "habit-reminders") {
    event.waitUntil(
      fetch("/api/cron/habits").catch(() => {})
    );
  }
});

// Fallback: on any fetch to the app origin, check if we should ping cron
// (piggyback on existing network activity)
let lastCronPing = 0;
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only intercept navigation/app requests, not external APIs
  if (url.origin === self.location.origin && url.pathname.startsWith("/dashboard")) {
    const now = Date.now();
    // Ping cron at most every 10 minutes when user is active
    if (now - lastCronPing > 10 * 60 * 1000) {
      lastCronPing = now;
      // Fire and forget — don't block the page load
      fetch("/api/cron/habits").catch(() => {});
    }
  }
});
