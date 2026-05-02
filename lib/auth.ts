"use client";

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

// ─── useAuth ────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
    const cred = await signInWithPopup(auth, googleProvider);
    // Create user doc if doesn't exist
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", cred.user.uid), {
        name: cred.user.displayName || "User",
        email: cred.user.email,
        avatar: "👤",
        houseId: null,
        createdAt: serverTimestamp(),
      });
    }
    return cred;
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

    const load = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const hid = userSnap.data().houseId;
          if (hid) {
            setHouseId(hid);
            const houseSnap = await getDoc(doc(db, "houses", hid));
            if (houseSnap.exists()) {
              setHouse(houseSnap.data() as HouseData);
            }
          }
        }
      } catch (e) {
        console.error("useHouse error:", e);
      }
      setLoading(false);
    };
    load();
  }, [uid]);

  return { houseId, house, loading };
}

// ─── House operations ────────────────────────────────────────────
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

  // Add user to house members
  await updateDoc(doc(db, "houses", houseId), {
    members: arrayUnion({ uid, name: userName, avatar: "👤", role: "member" }),
  });
  // Update user with houseId
  await updateDoc(doc(db, "users", uid), { houseId });
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
