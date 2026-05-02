// v0.6.0 — force cache update
const CACHE_VERSION = "v0.6.0";

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
  const { title, body } = payload.notification || {};
  if (!title) return;

  self.registration.showNotification(title, {
    body: body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || "casinha-" + Date.now(),
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/dashboard"));
});

// Force activate new service worker immediately (skip waiting)
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
