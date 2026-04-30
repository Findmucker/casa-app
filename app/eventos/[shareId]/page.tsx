"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import EventList from "@/components/EventList";
import { validateShareId } from "@/lib/share";

export default function PublicEventsPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    validateShareId(shareId).then(setValid);
  }, [shareId]);

  if (valid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="text-3xl animate-pulse">🎉</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <p className="text-rose-400 font-medium">Link inválido</p>
          <p className="text-pink-300 text-sm">Este link de partilha não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-purple-100/50 px-4 py-3.5 flex items-center justify-center">
        <h1 className="text-base font-bold text-purple-500 tracking-wide">
          🎉 Eventos — A Nossa Casinha
        </h1>
      </header>

      {/* Events */}
      <main className="flex-1">
        <EventList isPublic />
      </main>
    </div>
  );
}
