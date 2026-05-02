"use client";

import { useEffect, useState, useContext, createContext } from "react";
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
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

// Context for multi-tenant house scoping
export const HouseIdContext = createContext<string | null>(null);

// ─── Firestore collection with real-time sync ────────────────
export interface ShoppingItem {
  id: string;
  name: string;
  addedBy: string;
  done: boolean;
  urgent: boolean;
  category?: string;
  completedAt?: string;
  createdAt: unknown;
}

export interface SmallPriorityItem {
  id: string;
  name: string;
  done: boolean;
  order: number;
  price?: number;
  notes?: string;
  category?: string;
  completedAt?: string;
  assignee?: string;
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
  category?: string;
  subtasks?: Subtask[];
  completedAt?: string;
  createdAt: unknown;
}

export interface HabitItem {
  id: string;
  name: string;
  emoji: string;
  reminderTime?: string; // "HH:MM"
  assignee?: string;
  days?: number[]; // [0=dom,1=seg,...6=sáb] — undefined = todos os dias
  streak: number;
  lastChecked?: string; // ISO date "YYYY-MM-DD"
  createdAt: unknown;
}

export interface HabitCheck {
  id: string;
  habitId: string;
  date: string; // "YYYY-MM-DD"
  createdAt: unknown;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string; // ISO date
  createdAt: unknown;
}

export interface MealPlan {
  id: string;
  date: string; // "YYYY-MM-DD"
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
  createdAt: unknown;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  points: number;
  badges: string[];
}

export function useCollection<T extends { id: string }>(
  collectionName: string,
  orderField: string = "createdAt"
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const houseId = useContext(HouseIdContext);

  // Build collection path: houses/{houseId}/{name} or root {name}
  const getCollectionRef = () => {
    if (houseId) {
      return collection(db, "houses", houseId, collectionName);
    }
    return collection(db, collectionName);
  };

  const getDocRef = (id: string) => {
    if (houseId) {
      return doc(db, "houses", houseId, collectionName, id);
    }
    return doc(db, collectionName, id);
  };

  const buildQuery = () =>
    query(
      getCollectionRef(),
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
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setLoading(false);
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, orderField, houseId]);

  const add = async (data: Omit<T, "id" | "createdAt">) => {
    try {
      await addDoc(getCollectionRef(), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Add error:", e);
    }
  };

  const update = async (id: string, data: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    try {
      await updateDoc(getDocRef(id), data as Record<string, unknown>);
    } catch (e) {
      console.error("Update error:", e);
      await refetch();
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(getDocRef(id));
    } catch (e) {
      console.error("Delete error:", e);
      await refetch();
    }
  };

  return { items, loading, add, update, remove };
}

// ─── Lazy query hook — only fetches when enabled ────────────────
export function useLazyCollection<T extends { id: string }>(
  collectionName: string,
  orderField: string = "createdAt",
  enabled: boolean = false
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const houseId = useContext(HouseIdContext);

  useEffect(() => {
    if (!enabled) {
      setItems([]); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    setLoading(true);
    const colRef = houseId
      ? collection(db, "houses", houseId, collectionName)
      : collection(db, collectionName);

    const q = query(
      colRef,
      orderBy(orderField, orderField === "order" ? "asc" : "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
      setItems(data);
      setLoading(false);
    }, (error) => {
      console.error("Lazy snapshot error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [collectionName, orderField, houseId, enabled]);

  return { items, loading };
}

// ─── Shared collection data context (avoids duplicate listeners) ─
export interface CollectionData {
  shopping: ShoppingItem[];
  coisinhas: SmallPriorityItem[];
  projects: BigPriorityItem[];
  habits: HabitItem[];
  checks: HabitCheck[];
  expenses: ExpenseItem[];
}

export const CollectionDataContext = createContext<CollectionData | null>(null);

export function useSharedCollections(): CollectionData {
  const ctx = useContext(CollectionDataContext);
  if (!ctx) {
    throw new Error("useSharedCollections must be used within a CollectionDataContext.Provider");
  }
  return ctx;
}
