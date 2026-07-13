"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import EventList from "@/components/EventList";
import { getEventShare, type EventShare, type SharedEventSnapshot } from "@/lib/share";
import { HouseIdContext } from "@/lib/hooks";

export default function PublicEventsPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [share, setShare] = useState<EventShare | null | undefined>(undefined);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    getEventShare(shareId).then(setShare);
    const saved = localStorage.getItem("casa-guest-name");
    if (saved) setGuestName(saved);
  }, [shareId]);

  const handleSetName = () => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem("casa-guest-name", name);
    setGuestName(name);
  };

  if (share === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="text-3xl animate-pulse">🎉</div>
      </div>
    );
  }

  if (!share) {
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

  if (share.event) {
    return <SharedEventView event={share.event} />;
  }

  // Ask for name if not set
  if (!guestName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="flex flex-col items-center gap-5 p-8 max-w-sm">
          <div className="text-5xl animate-bounce-gentle">🏡</div>
          <h2 className="text-xl font-bold text-purple-500 text-center">
            Bem-vindo aos nossos eventos!
          </h2>
          <p className="text-sm text-pink-400 text-center leading-relaxed">
            Estamos a organizar algo especial 💕<br />
            Diz-nos o teu nome para participares!
          </p>
          <div className="w-full space-y-3 mt-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
              placeholder="O teu nome..."
              className="w-full rounded-2xl border border-purple-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 text-center transition-all"
              autoFocus
            />
            <button
              onClick={handleSetName}
              disabled={!nameInput.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 px-8 py-3 text-white font-semibold hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all disabled:opacity-40"
            >
              Entrar 🎉
            </button>
          </div>
          <p className="text-[11px] text-pink-300 text-center mt-2">
            Podes ver eventos, adicionar compras e tarefas, e juntar-te à organização!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-purple-100/50 px-4 py-3.5 flex items-center justify-between">
        <h1 className="text-base font-bold text-purple-500 tracking-wide">
          🎉 Eventos
        </h1>
        <span className="text-xs text-purple-400 bg-purple-50 px-2.5 py-1 rounded-full">
          👋 {guestName}
        </span>
      </header>

      {/* Events */}
      <main className="flex-1">
        <HouseIdContext.Provider value={share.houseId}>
          <EventList isPublic guestName={guestName} sharedEventId={share.eventId} />
        </HouseIdContext.Provider>
      </main>
    </div>
  );
}

function SharedEventView({ event }: { event: SharedEventSnapshot }) {
  const compras = event.items.filter((item) => item.type === "compra");
  const tarefas = event.items.filter((item) => item.type === "todo");
  const formattedDate = event.date
    ? new Date(`${event.date}T00:00:00`).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-8">
      <article className="mx-auto max-w-lg rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg shadow-pink-100/40 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">🎉 Evento partilhado</p>
        <h1 className="mt-2 text-2xl font-bold text-rose-700">{event.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-purple-500">
          {formattedDate && <span className="rounded-full bg-purple-50 px-3 py-1">📅 {formattedDate}</span>}
          {(event.participants.length > 0 || event.guests > 0) && (
            <span className="rounded-full bg-purple-50 px-3 py-1">
              👥 {event.participants.length}{event.guests > event.participants.length ? `/${event.guests}` : ""}
            </span>
          )}
        </div>

        {event.participants.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-pink-400">Participantes</h2>
            <p className="mt-2 text-sm text-rose-600">{event.participants.join(", ")}</p>
          </section>
        )}

        <SharedItemSection title="🛒 Compras" items={compras} />
        <SharedItemSection title="✅ Tarefas" items={tarefas} />

        {event.items.length === 0 && (
          <p className="mt-6 rounded-2xl bg-pink-50 px-4 py-3 text-center text-sm text-pink-400">
            Ainda não existem compras ou tarefas neste evento.
          </p>
        )}
      </article>
    </main>
  );
}

function SharedItemSection({
  title,
  items,
}: {
  title: string;
  items: SharedEventSnapshot["items"];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-pink-400">{title}</h2>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.type}-${item.name}-${index}`}
            className={`flex items-center justify-between rounded-2xl bg-pink-50/70 px-4 py-3 text-sm ${item.done ? "text-pink-300 line-through" : "text-rose-600"}`}
          >
            <span>{item.done ? "✓ " : ""}{item.name}</span>
            {item.assignee && <span className="text-xs text-purple-400">{item.assignee}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
