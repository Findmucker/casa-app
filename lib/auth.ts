"use client";

import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { auth, createGoogleProvider, db } from "./firebase";

// ─── useAuth ────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserDoc = useCallback(async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        email: firebaseUser.email,
        birthDate: null,
        avatar: "👤",
        houseId: null,
        createdAt: serverTimestamp(),
      });
      return;
    }

    if (userDoc.data().birthDate === undefined) {
      await updateDoc(userRef, { birthDate: null });
    }
  }, []);

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) await ensureUserDoc(result.user);
      })
      .catch((error) => {
        console.error("Google redirect login error:", error);
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [ensureUserDoc]);

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, password: string, birthDate?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Create user doc
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      birthDate: birthDate || null,
      avatar: "👤",
      houseId: null,
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  const loginWithGoogle = async () => {
    const provider = createGoogleProvider();

    try {
      const cred = await signInWithPopup(auth, provider);
      await ensureUserDoc(cred.user);
      return cred;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        await signInWithRedirect(auth, provider);
        return null;
      }

      throw error;
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, login, register, loginWithGoogle, logout };
}

// ─── Birth date migration for existing users ────────────────────
export async function checkNeedsBirthDate(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  return !snap.data().birthDate;
}

export async function saveBirthDate(uid: string, birthDate: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { birthDate });
}

// ─── useHouse ────────────────────────────────────────────────────
export interface HouseMember {
  uid: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
}

export interface HouseData {
  name: string;
  members: HouseMember[];
  createdAt: unknown;
}

export function useHouse(uid: string | null) {
  const [houseId, setHouseId] = useState<string | null>(null);
  const [house, setHouse] = useState<HouseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; } // eslint-disable-line react-hooks/set-state-in-effect

    let unsubHouse: (() => void) | null = null;

    const load = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const hid = userSnap.data().houseId;
          if (hid) {
            setHouseId(hid);
            // Use real-time listener so name/member changes propagate immediately
            const { onSnapshot } = await import("firebase/firestore");
            unsubHouse = onSnapshot(doc(db, "houses", hid), (snap) => {
              if (snap.exists()) {
                setHouse(snap.data() as HouseData);
              }
              setLoading(false);
            });
            return;
          }
        }
      } catch (e) {
        console.error("useHouse error:", e);
      }
      setLoading(false);
    };
    load();

    return () => {
      if (unsubHouse) unsubHouse();
    };
  }, [uid]);

  return { houseId, house, loading };
}

// ─── House operations ────────────────────────────────────────────
export async function updateHouseName(houseId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 30) return;
  const { updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(db, "houses", houseId), { name: trimmed });
}

export async function createHouse(uid: string, userName: string, houseName: string): Promise<string> {
  const { addDoc, collection } = await import("firebase/firestore");
  const houseRef = await addDoc(collection(db, "houses"), {
    name: houseName,
    members: [{ uid, name: userName, avatar: "👤", role: "admin" }],
    createdAt: serverTimestamp(),
  });
  // Update user with houseId
  await updateDoc(doc(db, "users", uid), { houseId: houseRef.id });
  return houseRef.id;
}

export async function joinHouse(uid: string, userName: string, inviteCode: string): Promise<boolean> {
  const inviteSnap = await getDoc(doc(db, "invites", inviteCode));
  if (!inviteSnap.exists()) return false;

  const { houseId, expiresAt } = inviteSnap.data();
  if (expiresAt && new Date(expiresAt) < new Date()) return false;

  // Get existing members before joining (for notification)
  const houseSnap = await getDoc(doc(db, "houses", houseId));
  const existingMembers: { name: string }[] = houseSnap.exists() ? (houseSnap.data().members || []) : [];

  // Add user to house members
  await updateDoc(doc(db, "houses", houseId), {
    members: arrayUnion({ uid, name: userName, avatar: "👤", role: "member" }),
  });
  // Update user with houseId
  await updateDoc(doc(db, "users", uid), { houseId });

  // Notify existing members that someone joined
  for (const m of existingMembers) {
    if (m.name.toLowerCase() === userName.toLowerCase()) continue;
    fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: m.name.toLowerCase(),
        title: "🏠 Novo membro!",
        body: `${userName} juntou-se à casa!`,
        tag: "member-joined",
      }),
    }).catch(() => {});
  }

  return true;
}

export async function createInvite(houseId: string, createdBy: string): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  await setDoc(doc(db, "invites", code), {
    houseId,
    createdBy,
    expiresAt: expires.toISOString(),
  });
  return code;
}
