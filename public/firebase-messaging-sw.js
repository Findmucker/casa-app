/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

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
    icon: "/icon.svg",
    badge: "/icon.svg",
    vibrate: [300, 100, 300, 100, 300],
    tag: "alarm-" + Date.now(),
    requireInteraction: true,
  });
});
