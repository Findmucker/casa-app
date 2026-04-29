// Update ShoppingItem to support urgency
"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { notify } from "./notifications";

// Collection display names for notifications
const COLLECTION_LABELS: Record<string, string> = {
  shopping: "🛒 Compras",
  priorities_small: "🪴 Coisinhas",
  priorities_big: "🏡 Projetos",
};

// ─── Auth ────────────────────────────────────────────────────
export function usePin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("casa-auth");
    if (saved === "true") setAuthenticated(true);
    setLoading(false);
  }, []);

  const verify = async (pin: string): Promise<boolean> => {
    try {
      const snap = await getDoc(doc(db, "config", "auth"));
      if (snap.exists() && snap.data().pin === pin) {
        localStorage.setItem("casa-auth", "true");
        setAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("casa-auth");
    setAuthenticated(false);
  };

  return { authenticated, loading, verify, logout };
}

// ─── Firestore collection with real-time sync ────────────────
export interface ShoppingItem {
  id: string;
  name: string;
  addedBy: string;
  done: boolean;
  urgent: boolean;
  createdAt: unknown;
}

export interface SmallPriorityItem {
  id: string;
  name: string;
  done: boolean;
  order: number;
  price?: number;
  createdAt: unknown;
}

export interface Subtask {
  id: string;
  name: string;
  done: boolean;
}

export interface BigPriorityItem {
  id: string;
  name: string;
  status: "pendente" | "em progresso" | "concluido";
  order: number;
  notes?: string;
  budget?: number;
  spent?: number;
  subtasks?: Subtask[];
  createdAt: unknown;
}

export function useCollection<T extends { id: string }>(
  collectionName: string,
  orderField: string = "createdAt"
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const prevMapRef = useRef<Map<string, T> | null>(null);
  const isFirstSnapshot = useRef(true);

  const buildQuery = () =>
    query(
      collection(db, collectionName),
      orderBy(orderField, orderField === "order" ? "asc" : "desc")
    );

  // Manual fetch as fallback
  const refetch = async () => {
    try {
      const snapshot = await getDocs(buildQuery());
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as T[];
      setItems(data);
    } catch (e) {
      console.warn("Refetch error:", e);
    }
  };

  useEffect(() => {
    const q = buildQuery();

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as T[];

      setItems(data);
      setLoading(false);

      // Notifications
      const currentMap = new Map(data.map((item) => [item.id, item]));
      try {
        if (!isFirstSnapshot.current && prevMapRef.current) {
          const prev = prevMapRef.current;
          const label = COLLECTION_LABELS[collectionName] || collectionName;

          for (const [, item] of currentMap) {
            const name = (item as Record<string, unknown>).name as string;
            if (name && !prev.has(item.id)) {
              notify(label, `Novo: ${name}`);
            }
          }
          for (const [id, item] of prev) {
            if (!currentMap.has(id)) {
              const name = (item as Record<string, unknown>).name as string;
              if (name) notify(label, `Removido: ${name}`);
            }
          }
          if (collectionName === "shopping") {
            for (const [, item] of currentMap) {
              const prevItem = prev.get(item.id);
              if (prevItem) {
                const wasUrgent = (prevItem as Record<string, unknown>).urgent;
                const isUrgent = (item as Record<string, unknown>).urgent;
                const name = (item as Record<string, unknown>).name as string;
                if (!wasUrgent && isUrgent && name) {
                  notify("🔥 Urgente!", name);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("Notification error:", e);
      }
      isFirstSnapshot.current = false;
      prevMapRef.current = currentMap;
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [collectionName, orderField]);

  const add = async (data: Omit<T, "id">) => {
    try {
      await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
      });
      // Refetch to guarantee UI updates even if onSnapshot is blocked
      await refetch();
    } catch (e) {
      console.error("Add error:", e);
    }
  };

  const update = async (id: string, data: Partial<T>) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    try {
      await updateDoc(doc(db, collectionName, id), data as Record<string, unknown>);
    } catch (e) {
      console.error("Update error:", e);
      await refetch();
    }
  };

  const remove = async (id: string) => {
    // Optimistic remove
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, collectionName, id));
      // Refetch to guarantee UI updates
      await refetch();
    } catch (e) {
      console.error("Delete error:", e);
      await refetch();
    }
  };

  return { items, loading, add, update, remove };
}
