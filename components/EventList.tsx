"use client";

import { useState } from "react";
import { useCollection } from "@/lib/hooks";

export interface EventItem {
  id: string;
  name: string;
  done: boolean;
  type: "compra" | "todo";
  createdAt: unknown;
}

export interface CasaEvent {
  id: string;
  title: string;
  date: string;
  guests: number;
  done: boolean;
  createdAt: unknown;
}

export default function EventList() {
  const { items: events, loading, add, update, remove } =
    useCollection<CasaEvent>("events");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await add({
      title: title.trim(),
      date,
      guests: parseInt(guests) || 0,
      done: false,
    } as unknown as Omit<CasaEvent, "id">);
    setTitle("");
    setDate("");
    setGuests("");
    setShowCreate(false);
  };

  const activeEvents = events.filter((e) => !e.done);
  const pastEvents = events.filter((e) => e.done);

  if (loading) {
    return (
      <div className="py-4 text-center text-pink-300 text-sm animate-pulse">
        A carregar eventos...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
          <span>🎉 Eventos</span>
          {activeEvents.length > 0 && (
            <span className="bg-purple-100 text-purple-500 px-2 py-0.5 rounded-full text-[10px]">
              {activeEvents.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-sm font-bold hover:bg-purple-200 active:scale-90 transition-all"
        >
          {showCreate ? "×" : "+"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/60 p-3.5 space-y-2.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Jantar de aniversário"
            className="w-full rounded-xl border border-purple-200/60 bg-white/80 px-3 py-2.5 text-sm text-rose-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 transition-all"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-xl border border-purple-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 focus:outline-none focus:border-purple-300 transition-all"
            />
            <input
              type="number"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Pessoas"
              className="w-24 rounded-xl border border-purple-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 transition-all"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white py-2.5 text-sm font-semibold hover:from-purple-500 hover:to-pink-500 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Criar evento
          </button>
        </div>
      )}

      {/* Active events */}
      {activeEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          expanded={expandedId === event.id}
          onToggleExpand={() =>
            setExpandedId(expandedId === event.id ? null : event.id)
          }
          onMarkDone={() => update(event.id, { done: true })}
          onDelete={() => remove(event.id)}
        />
      ))}

      {/* Past events (collapsed) */}
      {pastEvents.length > 0 && (
        <details className="group">
          <summary className="text-[11px] text-pink-300 cursor-pointer hover:text-pink-400 transition-colors list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Eventos passados ({pastEvents.length})
          </summary>
          <div className="mt-2 space-y-2">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-2 bg-pink-50/40 rounded-xl p-2.5 opacity-60"
              >
                <span className="text-sm">✓</span>
                <span className="flex-1 text-xs text-pink-400 line-through">
                  {event.title}
                </span>
                <button
                  onClick={() => remove(event.id)}
                  className="text-pink-200 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {activeEvents.length === 0 && !showCreate && pastEvents.length === 0 && (
        <p className="text-center text-xs text-pink-300 py-3">
          Sem eventos — toca no + para criar
        </p>
      )}
    </div>
  );
}

// ─── Event Card with sub-items ───────────────────────────────

interface EventCardProps {
  event: CasaEvent;
  expanded: boolean;
  onToggleExpand: () => void;
  onMarkDone: () => void;
  onDelete: () => void;
}

function EventCard({
  event,
  expanded,
  onToggleExpand,
  onMarkDone,
  onDelete,
}: EventCardProps) {
  const { items, add, update, remove } = useCollection<EventItem>(
    `events/${event.id}/items`
  );
  const [newItem, setNewItem] = useState("");
  const [newType, setNewType] = useState<"compra" | "todo">("compra");

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await add({
      name: newItem.trim(),
      done: false,
      type: newType,
    } as unknown as Omit<EventItem, "id">);
    setNewItem("");
  };

  const compras = items.filter((i) => i.type === "compra");
  const todos = items.filter((i) => i.type === "todo");
  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/40 overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-purple-50/30 transition-colors"
      >
        <span className="text-lg">🎉</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-rose-700 truncate">
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {event.date && (
              <span className="text-[11px] text-purple-400">
                📅 {formatDate(event.date)}
              </span>
            )}
            {event.guests > 0 && (
              <span className="text-[11px] text-purple-400">
                👥 {event.guests} pessoas
              </span>
            )}
            {items.length > 0 && (
              <span className="text-[10px] bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">
                {doneCount}/{items.length}
              </span>
            )}
          </div>
        </div>
        <span
          className={`text-pink-300 text-xs transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </button>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-3.5 pb-1">
          <div className="h-1 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="px-3.5 pb-3.5 pt-2 space-y-3 border-t border-purple-100/30">
          {/* Add item */}
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "compra" | "todo")}
              className="rounded-xl border border-purple-200/60 bg-white/80 px-2 py-2 text-xs text-purple-600 focus:outline-none"
            >
              <option value="compra">🛒 Compra</option>
              <option value="todo">✅ TODO</option>
            </select>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={
                newType === "compra" ? "O que comprar..." : "O que fazer..."
              }
              className="flex-1 rounded-xl border border-purple-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={!newItem.trim()}
              className="rounded-xl bg-purple-100 px-3 text-purple-500 font-bold hover:bg-purple-200 active:scale-90 transition-all disabled:opacity-30"
            >
              +
            </button>
          </div>

          {/* Shopping items */}
          {compras.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1.5">
                🛒 Compras
              </p>
              <div className="space-y-1">
                {compras.map((item) => (
                  <SubItem
                    key={item.id}
                    item={item}
                    onToggle={() => update(item.id, { done: !item.done })}
                    onDelete={() => remove(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TODO items */}
          {todos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1.5">
                ✅ A fazer
              </p>
              <div className="space-y-1">
                {todos.map((item) => (
                  <SubItem
                    key={item.id}
                    item={item}
                    onToggle={() => update(item.id, { done: !item.done })}
                    onDelete={() => remove(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onMarkDone}
              className="text-[11px] bg-green-100 text-green-600 px-3 py-1.5 rounded-xl hover:bg-green-200 active:scale-95 transition-all"
            >
              ✓ Concluir evento
            </button>
            <button
              onClick={onDelete}
              className="text-[11px] text-pink-300 px-3 py-1.5 hover:text-red-400 transition-colors"
            >
              Apagar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-item row ────────────────────────────────────────────

function SubItem({
  item,
  onToggle,
  onDelete,
}: {
  item: EventItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-purple-50/50 transition-colors">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] transition-all active:scale-90 ${
          item.done
            ? "bg-gradient-to-r from-purple-300 to-pink-300 text-white"
            : "border-2 border-purple-300 hover:bg-purple-100"
        }`}
      >
        {item.done ? "✓" : ""}
      </button>
      <span
        className={`flex-1 text-sm ${
          item.done ? "line-through text-purple-300" : "text-rose-700"
        }`}
      >
        {item.name}
      </span>
      <button
        onClick={onDelete}
        className="text-purple-200 hover:text-red-400 text-xs transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
