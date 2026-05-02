"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface UndoAction {
  id: string;
  label: string;
  undo: () => Promise<void>;
  timestamp: number;
}

interface UndoContextValue {
  lastAction: UndoAction | null;
  pushUndo: (label: string, undoFn: () => Promise<void>) => void;
  performUndo: () => void;
  dismiss: () => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

const UNDO_TIMEOUT = 8000;

export function UndoProvider({ children }: { children: ReactNode }) {
  const [lastAction, setLastAction] = useState<UndoAction | null>(null);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (!lastAction) return;
    const timer = setTimeout(() => setLastAction(null), UNDO_TIMEOUT);
    return () => clearTimeout(timer);
  }, [lastAction]);

  const pushUndo = useCallback((label: string, undoFn: () => Promise<void>) => {
    setLastAction({
      id: Date.now().toString(),
      label,
      undo: undoFn,
      timestamp: Date.now(),
    });
  }, []);

  const performUndo = useCallback(() => {
    if (lastAction) {
      lastAction.undo();
      setLastAction(null);
    }
  }, [lastAction]);

  const dismiss = useCallback(() => setLastAction(null), []);

  return (
    <UndoContext.Provider value={{ lastAction, pushUndo, performUndo, dismiss }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error("useUndo must be inside UndoProvider");
  return ctx;
}
