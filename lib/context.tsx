"use client";

import { createContext, useContext, type ReactNode } from "react";
import { HouseMember } from "./auth";

export interface HouseContextValue {
  houseId: string;
  houseName: string;
  userName: string;
  userId: string;
  members: HouseMember[];
}

const HouseContext = createContext<HouseContextValue | null>(null);

export function HouseProvider({
  children,
  houseId,
  houseName,
  userName,
  userId,
  members,
}: HouseContextValue & { children: ReactNode }) {
  return (
    <HouseContext.Provider value={{ houseId, houseName, userName, userId, members }}>
      {children}
    </HouseContext.Provider>
  );
}

export function useHouseContext(): HouseContextValue {
  const ctx = useContext(HouseContext);
  if (!ctx) throw new Error("useHouseContext must be inside HouseProvider");
  return ctx;
}

/** Safe version — returns null outside HouseProvider (e.g. public pages) */
export function useHouseContextSafe(): HouseContextValue | null {
  return useContext(HouseContext);
}

/** Get member names for assignee/payer selectors. Returns ["Member1", "Member2", "Ambos"] style list */
export function useMemberNames(): { key: string; label: string; emoji: string }[] {
  const ctx = useContext(HouseContext);
  if (!ctx || ctx.members.length === 0) {
    return [
      { key: "member1", label: "Membro 1", emoji: "👤" },
      { key: "member2", label: "Membro 2", emoji: "👤" },
      { key: "ambos", label: "Ambos", emoji: "👫" },
    ];
  }
  const list = ctx.members.map((m) => ({
    key: m.name.toLowerCase(),
    label: m.name,
    emoji: m.avatar || "👤",
  }));
  list.push({ key: "ambos", label: "Ambos", emoji: "👫" });
  return list;
}
