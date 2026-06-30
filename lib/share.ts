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
}

export async function getOrCreateShareId(houseId: string): Promise<string> {
  if (!houseId) throw new Error("Missing house id for event sharing");

  const houseShareRef = doc(db, "event_share_houses", houseId);
  const houseShareSnap = await getDoc(houseShareRef);

  if (houseShareSnap.exists() && houseShareSnap.data().shareId) {
    return houseShareSnap.data().shareId as string;
  }

  const shareId = generateId();
  await setDoc(houseShareRef, { shareId, houseId });
  await setDoc(doc(db, "event_shares", shareId), { shareId, houseId });
  return shareId;
}

export async function getEventShare(id: string): Promise<EventShare | null> {
  const shareSnap = await getDoc(doc(db, "event_shares", id));
  if (shareSnap.exists()) {
    const data = shareSnap.data();
    if (typeof data.houseId === "string" && data.houseId) {
      return { shareId: id, houseId: data.houseId };
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
