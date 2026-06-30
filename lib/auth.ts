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
  linkWithPopup,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,

  type User,
} from "firebase/auth";
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, createGoogleProvider, db } from "./firebase";

// ─── useAuth ────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserDoc = useCallback(async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    const fallbackProfile = {
      name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
      email: firebaseUser.email?.toLowerCase() || null,
      birthDate: null,
      avatar: "👤",
      houseId: null as string | null,
      createdAt: serverTimestamp(),
    };

    const findExistingUserByEmail = async () => {
      if (!firebaseUser.email) return null;

      const normalizedEmail = firebaseUser.email.toLowerCase();
      const matchingUsers = await getDocs(query(collection(db, "users"), where("email", "==", normalizedEmail)));
      const legacyMatchingUsers =
        normalizedEmail === firebaseUser.email
          ? { docs: [] }
          : await getDocs(query(collection(db, "users"), where("email", "==", firebaseUser.email)));

      return [...matchingUsers.docs, ...legacyMatchingUsers.docs].find((snap) => snap.id !== firebaseUser.uid) || null;
    };

    const connectExistingProfile = async (existingUser: NonNullable<Awaited<ReturnType<typeof findExistingUserByEmail>>>) => {
      const existingProfile = existingUser.data();
      await setDoc(userRef, {
        ...fallbackProfile,
        ...existingProfile,
        email: firebaseUser.email?.toLowerCase() || existingProfile.email || null,
        linkedUid: existingUser.id,
        linkedAt: serverTimestamp(),
      }, { merge: true });

      if (typeof existingProfile.houseId === "string") {
        const houseRef = doc(db, "houses", existingProfile.houseId);
        const houseSnap = await getDoc(houseRef);
        if (houseSnap.exists()) {
          const members = houseSnap.data().members;
          if (Array.isArray(members)) {
            await updateDoc(houseRef, {
              members: members.map((member) =>
                member && typeof member === "object" && "uid" in member && member.uid === existingUser.id
                  ? { ...member, uid: firebaseUser.uid }
                  : member,
              ),
            });
          }
        }
      }
    };

    if (!userDoc.exists()) {
      const existingUser = await findExistingUserByEmail();
      if (existingUser) {
        await connectExistingProfile(existingUser);
        return;
      }

      const housesSnap = await getDocs(collection(db, "houses"));
      for (const house of housesSnap.docs) {
        const members = house.data().members;
        if (!Array.isArray(members)) continue;

        const member = members.find(
          (item) => item && typeof item === "object" && "uid" in item && item.uid === firebaseUser.uid,
        );
        if (member && typeof member === "object") {
          fallbackProfile.houseId = house.id;
          if ("name" in member && typeof member.name === "string" && member.name.trim()) {
            fallbackProfile.name = member.name;
          }
          break;
        }
      }

      await setDoc(userRef, fallbackProfile);
      return;
    }

    const currentProfile = userDoc.data();
    const existingUser = await findExistingUserByEmail();
    if (existingUser && !currentProfile.houseId) {
      await connectExistingProfile(existingUser);
      return;
    }

    const updates: Record<string, unknown> = {};
    if (currentProfile.birthDate === undefined) updates.birthDate = null;
    if (firebaseUser.email && currentProfile.email !== firebaseUser.email.toLowerCase()) {
      updates.email = firebaseUser.email.toLowerCase();
    }
    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
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
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      ensureUserDoc(u)
        .catch((error) => {
          console.error("User profile recovery error:", error);
        })
        .finally(() => {
          setUser(u);
          setLoading(false);
        });
    });
    return () => unsub();
  }, [ensureUserDoc]);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(cred.user);
    return cred;
  };

  const register = async (name: string, email: string, password: string, birthDate?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Create user doc
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email: email.toLowerCase(),
      birthDate: birthDate || null,
      avatar: "👤",
      houseId: null,
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  const loginWithGoogle = async (passwordForExistingAccount?: string) => {
    const provider = createGoogleProvider();
    const currentUser = auth.currentUser;

    try {
      if (currentUser?.email) {
        if (currentUser.providerData.some((providerData) => providerData.providerId === "google.com")) {
          await ensureUserDoc(currentUser);
          return null;
        }

        const cred = await linkWithPopup(currentUser, provider);
        await ensureUserDoc(cred.user);
        return cred;
      }

      const cred = await signInWithPopup(auth, provider);
      await ensureUserDoc(cred.user);
      return cred;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      const linkedEmail =
        typeof error === "object" &&
        error !== null &&
        "customData" in error &&
        typeof error.customData === "object" &&
        error.customData !== null &&
        "email" in error.customData
          ? String(error.customData.email)
          : null;

      if (currentUser?.email && linkedEmail && currentUser.email.toLowerCase() !== linkedEmail.toLowerCase()) {
        throw new Error("A conta Google selecionada usa um email diferente da conta atual.");
      }

      if (code === "auth/account-exists-with-different-credential" && linkedEmail) {
        const methods = await fetchSignInMethodsForEmail(auth, linkedEmail);
        const googleCredential = GoogleAuthProvider.credentialFromError(error as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);

        if (methods.includes("password") && googleCredential) {
          if (!passwordForExistingAccount) {
            throw new Error("Esta conta já existe com email/password. Escreve a password dessa conta e carrega novamente no botão Google para ligar o Google sem perder os dados.");
          }

          const cred = await signInWithEmailAndPassword(auth, linkedEmail, passwordForExistingAccount);
          await linkWithCredential(cred.user, googleCredential);
          await ensureUserDoc(cred.user);
          return cred;
        }

        if (methods.includes("password")) {
          throw new Error("Esta conta já existe com email/password. Entra primeiro com email/password e depois liga Google em Perfil → Google.");
        }
        throw new Error("Esta conta já existe com outro método de login. Entra primeiro com esse método e depois liga Google em Perfil → Google.");
      }

      if (code === "auth/provider-already-linked") {
        if (currentUser) await ensureUserDoc(currentUser);
        return null;
      }

      if (code === "auth/credential-already-in-use" || code === "auth/email-already-in-use") {
        throw new Error("Esta conta Google já está ligada a outra sessão. Sai da conta atual e entra diretamente com Google.");
      }

      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        await signInWithRedirect(auth, provider);
        return null;
      }

      throw error;
    }
  };

  const logout = () => signOut(auth);

  const linkGoogleAccount = () => loginWithGoogle();

  return { user, loading, login, register, loginWithGoogle, linkGoogleAccount, logout };
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
    if (!uid) {
      setHouseId(null);
      setHouse(null);
      setLoading(false);
      return;
    }

    setHouseId(null);
    setHouse(null);
    setLoading(true);
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
