"use client";

import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Request notification permission and save token
export async function requestNotificationPermission(owner: string): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  // Register service worker for background notifications
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.info("SW registered:", registration.scope);
    } catch (e) {
      console.warn("SW registration failed:", e);
    }
  }

  // Save that this user has notifications enabled
  await setDoc(doc(db, "notification_settings", owner), {
    enabled: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return true;
}

// Schedule a local notification at a specific time
export function scheduleLocalNotification(title: string, body: string, timeStr: string): number | null {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If time already passed today, schedule for tomorrow
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
    // Reschedule for next day
    scheduleLocalNotification(title, body, timeStr);
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
