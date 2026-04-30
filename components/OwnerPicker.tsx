"use client";

import { useState, useEffect } from "react";

interface OwnerPickerProps {
  onSelect: (owner: "eduardo" | "moniquinha") => void;
}

export default function OwnerPicker({ onSelect }: OwnerPickerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className={`flex flex-col items-center gap-8 p-8 transition-all duration-500 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="text-5xl animate-float">🏡</div>
        <h2 className="text-xl font-bold text-rose-400">Quem és?</h2>
        <div className="flex gap-4">
          <button
            onClick={() => onSelect("eduardo")}
            className="flex flex-col items-center gap-2 bg-white/80 rounded-3xl px-8 py-6 border border-pink-100/60 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <span className="text-4xl">🧔</span>
            <span className="text-sm font-semibold text-rose-500">Eduardo</span>
          </button>
          <button
            onClick={() => onSelect("moniquinha")}
            className="flex flex-col items-center gap-2 bg-white/80 rounded-3xl px-8 py-6 border border-pink-100/60 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <span className="text-4xl">👩</span>
            <span className="text-sm font-semibold text-rose-500">Moniquinha</span>
          </button>
        </div>
        <p className="text-xs text-pink-300">Para os alarmes saberem para quem tocar</p>
      </div>
    </div>
  );
}
