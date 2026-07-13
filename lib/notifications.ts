"use client";

import { getFCMToken } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { authenticatedFetch } from "./api";
import { getLocalClock } from "./habit-reminder-time";

/**
 * Send a push notification to a specific member (by lowercase name).
 * Fire-and-forget — errors are silently ignored.
 */
export function sendPushToMember(to: string, title: string, body: string, tag = "general") {
  authenticatedFetch("/api/send-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: to.toLowerCase(), title, body, tag }),
  }).catch(() => {});
}

/**
 * Send a push notification to all house members except the sender.
 */
export function notifyOtherMembers(
  members: { name: string }[],
  senderName: string,
  title: string,
  body: string,
  tag = "general"
) {
  for (const m of members) {
    if (m.name.toLowerCase() !== senderName.toLowerCase()) {
      sendPushToMember(m.name, title, body, tag);
    }
  }
}

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
export async function registerPushToken(uid: string): Promise<boolean> {
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
    await setDoc(doc(db, "fcm_tokens", uid), {
      uid,
      token,
      updatedAt: new Date().toISOString(),
    });

    // Register periodic background sync (Android/Chrome — habit reminders every 10 min)
    try {
      const registration = await navigator.serviceWorker.ready;
      if ("periodicSync" in registration) {
        const status = await navigator.permissions.query({ name: "periodic-background-sync" as PermissionName });
        if (status.state === "granted") {
          await (registration as unknown as { periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> } }).periodicSync.register("habit-reminders", { minInterval: 10 * 60 * 1000 });
        }
      }
    } catch {
      // Periodic sync not supported — fallback to SW fetch piggyback
    }

    return true;
  } catch (e) {
    console.error("Push registration error:", e);
    return false;
  }
}

// Schedule a local notification at a specific time, repeating every 10 min until cancelled
export function scheduleLocalNotification(title: string, body: string, timeStr: string): number | null {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If time already passed today, check if within 2h window for repeat
  if (target <= now) {
    const diffMs = now.getTime() - target.getTime();
    const diffMin = diffMs / 60000;
    if (diffMin > 120) {
      // Past 2h window, schedule for tomorrow
      target.setDate(target.getDate() + 1);
    }
  }

  const delay = Math.max(0, target.getTime() - now.getTime());

  // First notification at reminder time, then repeat every 10 min for up to 2 hours
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

// Schedule repeating notifications every 10 min for a habit (client-side)
export function scheduleRepeatingNotification(
  title: string,
  body: string,
  timeStr: string,
  isChecked: () => boolean
): number | null {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target > now) {
    // Not yet time, schedule first fire
    const delay = target.getTime() - now.getTime();
    const timerId = window.setTimeout(() => {
      startRepeat();
    }, delay);
    return timerId;
  }

  // Already past reminder time — check if within 2h window
  const diffMin = (now.getTime() - target.getTime()) / 60000;
  if (diffMin > 120) return null;

  // Start immediately
  const id = startRepeat();
  return id;

  function startRepeat(): number {
    // Send now if not checked
    if (!isChecked()) {
      new Notification(title, { body, icon: "/icon-192.png", tag: `habit-${title}` });
    }
    // Repeat every 10 min
    const intervalId = window.setInterval(() => {
      if (isChecked()) {
        window.clearInterval(intervalId);
        return;
      }
      // Check if still within 2h window
      const nowCheck = new Date();
      const reminderToday = new Date();
      reminderToday.setHours(hours, minutes, 0, 0);
      if ((nowCheck.getTime() - reminderToday.getTime()) / 60000 > 120) {
        window.clearInterval(intervalId);
        return;
      }
      new Notification(title, { body, icon: "/icon-192.png", tag: `habit-${title}` });
    }, 10 * 60 * 1000);
    return intervalId;
  }
}

// Cancel a scheduled notification
export function cancelNotification(timerId: number) {
  window.clearTimeout(timerId);
}

// Get today's date as YYYY-MM-DD
export function getToday(): string {
  return getLocalClock(new Date()).date;
}

// Check if a date string is today
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}
