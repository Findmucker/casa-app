"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

function generateId(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export interface EventShare {
  shareId: string;
  houseId: string;
  eventId?: string;
  event?: SharedEventSnapshot;
}

export interface SharedEventItem {
  name: string;
  type: "compra" | "todo";
  done: boolean;
  assignee?: string;
}

export interface SharedEventSnapshot {
  id: string;
  title: string;
  date: string;
  guests: number;
  participants: string[];
  items: SharedEventItem[];
}

export async function createEventShare(
  houseId: string,
  event: SharedEventSnapshot
): Promise<string> {
  if (!houseId) throw new Error("Missing house id for event sharing");
  if (!event.id) throw new Error("Missing event id for event sharing");

  const shareId = generateId();
  await setDoc(doc(db, "event_shares", shareId), {
    shareId,
    houseId,
    eventId: event.id,
    event,
  });
  return shareId;
}

export async function getEventShare(id: string): Promise<EventShare | null> {
  const shareSnap = await getDoc(doc(db, "event_shares", id));
  if (shareSnap.exists()) {
    const data = shareSnap.data();
    if (typeof data.houseId === "string" && data.houseId) {
      return {
        shareId: id,
        houseId: data.houseId,
        eventId: typeof data.eventId === "string" ? data.eventId : undefined,
        event: data.event as SharedEventSnapshot | undefined,
      };
    }
  }

  const legacySnap = await getDoc(doc(db, "config", "events-share"));
  if (legacySnap.exists() && legacySnap.data().shareId === id) {
    const legacyHouseId = legacySnap.data().houseId;
    if (typeof legacyHouseId === "string" && legacyHouseId) {
      return { shareId: id, houseId: legacyHouseId };
    }
  }

  return null;
}

export async function validateShareId(id: string): Promise<boolean> {
  return (await getEventShare(id)) !== null;
}
