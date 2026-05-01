// Firebase Cloud Messaging Service Worker
// Handles background push notifications

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "🏡 A Nossa Casinha";
  const options = {
    body: data.body || "Tens algo para verificar!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "default",
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/dashboard")
  );
});
