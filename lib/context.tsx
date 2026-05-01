"use client";

import { createContext, useContext, type ReactNode } from "react";

interface HouseContextValue {
  houseId: string;
  userName: string;
  userId: string;
}

const HouseContext = createContext<HouseContextValue | null>(null);

export function HouseProvider({
  children,
  houseId,
  userName,
  userId,
}: HouseContextValue & { children: ReactNode }) {
  return (
    <HouseContext.Provider value={{ houseId, userName, userId }}>
      {children}
    </HouseContext.Provider>
  );
}

export function useHouseContext(): HouseContextValue {
  const ctx = useContext(HouseContext);
  if (!ctx) throw new Error("useHouseContext must be inside HouseProvider");
  return ctx;
}
