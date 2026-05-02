"use client";

import { getFCMToken } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Request notification permission (basic browser API)
export function requestNotificationPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// Show a local notification immediately
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
 * Register the Service Worker and save the FCM token to Firestore.
 * This enables real push notifications even when the app is closed.
 */
export async function registerPushToken(owner: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;

  try {
    // Register the FCM service worker
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    // Get permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Get FCM token
    const token = await getFCMToken();
    if (!token) return false;

    // Save token to Firestore (keyed by owner so each person has their token)
    await setDoc(doc(db, "fcm_tokens", owner), {
      token,
      updatedAt: new Date().toISOString(),
    });

    console.log("FCM token registered for", owner);
    return true;
  } catch (e) {
    console.error("Push registration error:", e);
    return false;
  }
}

// Schedule a local notification at a specific time (single fire, fallback)
export function scheduleLocalNotification(title: string, body: string, timeStr: string): number | null {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  const timerId = window.setTimeout(() => {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `habit-${title}`,
    });
  }, delay);

  return timerId;
}

// Cancel a scheduled notification
export function cancelNotification(timerId: number) {
  window.clearTimeout(timerId);
}

// Get today's date as YYYY-MM-DD
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// Check if a date string is today
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}
