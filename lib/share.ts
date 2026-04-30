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

export async function getOrCreateShareId(): Promise<string> {
  const ref = doc(db, "config", "events-share");
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data().shareId) {
    return snap.data().shareId as string;
  }

  const shareId = generateId();
  await setDoc(ref, { shareId });
  return shareId;
}

export async function validateShareId(id: string): Promise<boolean> {
  const ref = doc(db, "config", "events-share");
  const snap = await getDoc(ref);
  return snap.exists() && snap.data().shareId === id;
}
