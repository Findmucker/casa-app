"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ───────────────────────────────────────────────────
export interface FriendHouse {
  id: string; // friendHouseId (doc ID)
  houseId: string;
  houseName: string;
  connectedAt: unknown;
  members?: { name: string; birthday?: string }[];
}

export interface FriendRequest {
  id: string;
  fromHouseId: string;
  fromHouseName: string;
  toHouseId: string;
  toHouseName: string;
  createdAt: unknown;
  status: "pending" | "accepted" | "rejected";
}

// ─── Friend Code ─────────────────────────────────────────────
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getFriendCode(houseId: string): Promise<string> {
  const houseRef = doc(db, "houses", houseId);
  const snap = await getDoc(houseRef);
  if (snap.exists() && snap.data().friendCode) {
    return snap.data().friendCode;
  }
  const code = generateCode();
  await updateDoc(houseRef, { friendCode: code });
  return code;
}

// ─── Connect by Code ─────────────────────────────────────────
export async function connectByCode(
  myHouseId: string,
  myHouseName: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  // Find house with this friendCode
  const housesRef = collection(db, "houses");
  const q = query(housesRef, where("friendCode", "==", code.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { success: false, error: "invalid_code" };
  }

  const friendDoc = snapshot.docs[0];
  const friendHouseId = friendDoc.id;

  if (friendHouseId === myHouseId) {
    return { success: false, error: "own_house" };
  }

  // Check if already friends
  const existingRef = doc(db, "houses", myHouseId, "friends", friendHouseId);
  const existing = await getDoc(existingRef);
  if (existing.exists()) {
    return { success: false, error: "already_friends" };
  }

  const friendHouseName = friendDoc.data().name || "Casa";
  const friendMembers: { name: string }[] = (friendDoc.data().members || []).map((m: { name: string }) => ({ name: m.name }));

  // Get my house members
  const myHouseDoc = await getDoc(doc(db, "houses", myHouseId));
  const myMembers: { name: string }[] = (myHouseDoc.data()?.members || []).map((m: { name: string }) => ({ name: m.name }));

  // Create bidirectional friendship
  await setDoc(doc(db, "houses", myHouseId, "friends", friendHouseId), {
    houseId: friendHouseId,
    houseName: friendHouseName,
    members: friendMembers,
    connectedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "houses", friendHouseId, "friends", myHouseId), {
    houseId: myHouseId,
    houseName: myHouseName,
    members: myMembers,
    connectedAt: serverTimestamp(),
  });

  return { success: true };
}

// ─── Friend Requests ─────────────────────────────────────────
export async function sendFriendRequest(
  fromHouseId: string,
  fromHouseName: string,
  toHouseId: string,
  toHouseName: string
): Promise<void> {
  await addDoc(collection(db, "friend_requests"), {
    fromHouseId,
    fromHouseName,
    toHouseId,
    toHouseName,
    createdAt: serverTimestamp(),
    status: "pending",
  });
}

export async function acceptFriendRequest(
  requestId: string,
  fromHouseId: string,
  fromHouseName: string,
  toHouseId: string,
  toHouseName: string
): Promise<void> {
  // Update request status
  await updateDoc(doc(db, "friend_requests", requestId), { status: "accepted" });

  // Fetch members from both houses
  const fromHouseDoc = await getDoc(doc(db, "houses", fromHouseId));
  const toHouseDoc = await getDoc(doc(db, "houses", toHouseId));
  const fromMembers: { name: string }[] = (fromHouseDoc.data()?.members || []).map((m: { name: string }) => ({ name: m.name }));
  const toMembers: { name: string }[] = (toHouseDoc.data()?.members || []).map((m: { name: string }) => ({ name: m.name }));

  // Create bidirectional friendship
  await setDoc(doc(db, "houses", toHouseId, "friends", fromHouseId), {
    houseId: fromHouseId,
    houseName: fromHouseName,
    members: fromMembers,
    connectedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "houses", fromHouseId, "friends", toHouseId), {
    houseId: toHouseId,
    houseName: toHouseName,
    members: toMembers,
    connectedAt: serverTimestamp(),
  });
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, "friend_requests", requestId), { status: "rejected" });
}

// ─── Remove Friend ───────────────────────────────────────────
export async function removeFriend(houseId: string, friendHouseId: string): Promise<void> {
  await deleteDoc(doc(db, "houses", houseId, "friends", friendHouseId));
  await deleteDoc(doc(db, "houses", friendHouseId, "friends", houseId));
}

// ─── Search Houses ───────────────────────────────────────────
export async function searchHouses(
  searchQuery: string,
  myHouseId: string
): Promise<{ id: string; name: string; members: string[] }[]> {
  if (!searchQuery || searchQuery.length < 2) return [];

  const housesRef = collection(db, "houses");
  const snapshot = await getDocs(housesRef);

  const results: { id: string; name: string; members: string[] }[] = [];
  const lowerQuery = searchQuery.toLowerCase();

  snapshot.docs.forEach((d) => {
    if (d.id === myHouseId) return;
    const data = d.data();
    const name = data.name || "";
    if (name.toLowerCase().includes(lowerQuery)) {
      const memberNames = (data.members || []).map((m: { name: string }) => m.name);
      results.push({ id: d.id, name, members: memberNames });
    }
  });

  return results.slice(0, 10);
}

// ─── Real-time Hooks ─────────────────────────────────────────
export function useFriends(houseId: string | null) {
  const [friends, setFriends] = useState<FriendHouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!houseId) return;

    const ref = collection(db, "houses", houseId, "friends");
    const q = query(ref, orderBy("connectedAt", "desc"));

    const unsub = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FriendHouse[];

      // Backfill members for legacy friend docs that lack them
      const enriched = await Promise.all(
        data.map(async (f) => {
          if (f.members && f.members.length > 0) return f;
          try {
            const houseSnap = await getDoc(doc(db, "houses", f.houseId));
            if (houseSnap.exists()) {
              const members = (houseSnap.data().members || []).map((m: { name: string }) => ({ name: m.name }));
              // Update the friend doc for future loads
              setDoc(doc(db, "houses", houseId!, "friends", f.id), { members }, { merge: true }).catch(() => {});
              return { ...f, members };
            }
          } catch { /* ignore */ }
          return f;
        })
      );

      setFriends(enriched);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [houseId]);

  return { friends, loading };
}

export function usePendingRequests(houseId: string | null) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!houseId) return;

    const ref = collection(db, "friend_requests");
    const q = query(ref, where("toHouseId", "==", houseId), where("status", "==", "pending"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FriendRequest[];
      setRequests(data);
    });

    return unsub;
  }, [houseId]);

  return { requests };
}
