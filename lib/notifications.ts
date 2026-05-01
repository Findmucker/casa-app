import { getFCMToken } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export function requestNotificationPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function notify(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
}

/**
 * Register the Service Worker and save the FCM token to Firestore
 * under the given owner name.
 */
export async function registerPushToken(owner: string) {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    // Register the FCM service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;

    // Get permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // Get FCM token
    const token = await getFCMToken();
    if (!token) return;

    // Save token to Firestore (keyed by owner so each person has their token)
    await setDoc(doc(db, "fcm_tokens", owner), {
      token,
      updatedAt: new Date().toISOString(),
    });

    console.log("FCM token registered for", owner);
    return registration;
  } catch (e) {
    console.error("Push registration error:", e);
  }
}
