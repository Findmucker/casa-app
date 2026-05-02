"use client";

import { useUndo } from "@/lib/useUndoStack";

export default function UndoToast() {
  const { lastAction, performUndo, dismiss } = useUndo();

  if (!lastAction) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
      <div className="flex items-center gap-3 bg-gray-900/90 backdrop-blur-sm text-white rounded-2xl px-4 py-3 shadow-xl">
        <span className="text-sm truncate max-w-[200px]">{lastAction.label}</span>
        <button
          onClick={performUndo}
          className="text-amber-400 font-bold text-sm hover:text-amber-300 active:scale-95 transition-all whitespace-nowrap"
        >
          Desfazer
        </button>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="text-gray-400 hover:text-white text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
