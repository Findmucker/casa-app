"use client";

import { useState, useEffect } from "react";
import { useCollection } from "@/lib/hooks";
import { getOrCreateShareId } from "@/lib/share";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Weather for event dates ────────────────────────────────

interface DateWeather {
  tempMax: number;
  tempMin: number;
  weathercode: number;
  precipProb: number;
}

const WMO_CODES: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "☀️", label: "Céu limpo" },
  1: { emoji: "🌤️", label: "Quase limpo" },
  2: { emoji: "⛅", label: "Parcialmente nublado" },
  3: { emoji: "☁️", label: "Nublado" },
  45: { emoji: "🌫️", label: "Nevoeiro" },
  48: { emoji: "🌫️", label: "Nevoeiro" },
  51: { emoji: "🌦️", label: "Chuvisco" },
  53: { emoji: "🌦️", label: "Chuvisco" },
  55: { emoji: "🌦️", label: "Chuvisco forte" },
  61: { emoji: "🌧️", label: "Chuva leve" },
  63: { emoji: "🌧️", label: "Chuva" },
  65: { emoji: "🌧️", label: "Chuva forte" },
  80: { emoji: "🌦️", label: "Aguaceiros" },
  81: { emoji: "🌦️", label: "Aguaceiros" },
  82: { emoji: "⛈️", label: "Aguaceiros fortes" },
  95: { emoji: "⛈️", label: "Trovoada" },
  96: { emoji: "⛈️", label: "Trovoada" },
  99: { emoji: "⛈️", label: "Trovoada forte" },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] || { emoji: "🌡️", label: "Desconhecido" };
}

// Cache weather data in memory
let weatherCache: { data: Record<string, DateWeather>; fetchedAt: number } | null = null;

async function fetchWeatherForDates(): Promise<Record<string, DateWeather>> {
  // Cache for 30 minutes
  if (weatherCache && Date.now() - weatherCache.fetchedAt < 30 * 60 * 1000) {
    return weatherCache.data;
  }
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=39.36&longitude=-9.16&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Europe/Lisbon&forecast_days=7"
    );
    const json = await res.json();
    const result: Record<string, DateWeather> = {};
    for (let i = 0; i < json.daily.time.length; i++) {
      result[json.daily.time[i]] = {
        tempMax: Math.round(json.daily.temperature_2m_max[i]),
        tempMin: Math.round(json.daily.temperature_2m_min[i]),
        weathercode: json.daily.weather_code[i],
        precipProb: json.daily.precipitation_probability_max[i],
      };
    }
    weatherCache = { data: result, fetchedAt: Date.now() };
    return result;
  } catch {
    return {};
  }
}

function useEventWeather(date: string): DateWeather | null {
  const [weather, setWeather] = useState<DateWeather | null>(null);
  useEffect(() => {
    if (!date) return;
    fetchWeatherForDates().then((data) => {
      if (data[date]) setWeather(data[date]);
    });
  }, [date]);
  return weather;
}

export interface EventItem {
  id: string;
  name: string;
  done: boolean;
  type: "compra" | "todo";
  assignee?: string;
  createdAt: unknown;
}

export interface CasaEvent {
  id: string;
  title: string;
  date: string;
  guests: number;
  participants: string[];
  done: boolean;
  createdAt: unknown;
}

interface EventListProps {
  isPublic?: boolean;
  guestName?: string;
}

export default function EventList({ isPublic = false, guestName }: EventListProps) {
  const { items: events, loading, add, update, remove } =
    useCollection<CasaEvent>("events");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // In public mode, only show events the guest is registered in
  // In app mode (not public), show all
  const currentUser = isPublic ? guestName : null;

  const handleCreate = async () => {
    if (!title.trim()) return;
    const participants = currentUser ? [currentUser] : [];
    await add({
      title: title.trim(),
      date,
      guests: parseInt(guests) || 0,
      participants,
      done: false,
    } as unknown as Omit<CasaEvent, "id">);
    setTitle("");
    setDate("");
    setGuests("");
    setShowCreate(false);
  };

  const handleJoin = async (event: CasaEvent) => {
    if (!currentUser) return;
    const participants = event.participants || [];
    if (!participants.includes(currentUser)) {
      await update(event.id, { participants: [...participants, currentUser] });
    }
  };

  const handleShare = async () => {
    try {
      const shareId = await getOrCreateShareId();
      const url = `${window.location.origin}/eventos/${shareId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const handleClone = async (event: CasaEvent) => {
    // Create new event with same details
    const newEvent = await add({
      title: `${event.title} (cópia)`,
      date: "",
      guests: event.guests,
      done: false,
    } as unknown as Omit<CasaEvent, "id">);

    // Copy items from old event (reset done to false)
    // We need to get the items from the original event subcollection
    try {
      const itemsSnap = await getDocs(collection(db, `events/${event.id}/items`));
      const { addDoc, serverTimestamp } = await import("firebase/firestore");
      // Find the new event ID (it's the last active one with this title)
      const eventsSnap = await getDocs(collection(db, "events"));
      const allEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const newest = allEvents
        .filter((e) => (e as unknown as CasaEvent).title === `${event.title} (cópia)`)
        .pop();

      if (newest) {
        for (const itemDoc of itemsSnap.docs) {
          const data = itemDoc.data();
          await addDoc(collection(db, `events/${newest.id}/items`), {
            name: data.name,
            type: data.type,
            done: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      console.error("Clone items error:", e);
    }
  };

  const activeEvents = events.filter((e) => !e.done);
  const pastEvents = events.filter((e) => e.done);

  // In public mode, split into "my events" (registered) and "available" (not registered)
  const myEvents = isPublic && currentUser
    ? activeEvents.filter((e) => (e.participants || []).includes(currentUser))
    : activeEvents;
  const availableEvents = isPublic && currentUser
    ? activeEvents.filter((e) => !(e.participants || []).includes(currentUser))
    : [];

  if (loading) {
    return (
      <div className="py-4 text-center text-pink-300 text-sm animate-pulse">
        A carregar eventos...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
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
        <div className="flex items-center gap-2">
          {/* Share button (only in app, not public page) */}
          {!isPublic && (
            <button
              onClick={handleShare}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-90 ${
                copied
                  ? "bg-green-100 text-green-600"
                  : "bg-purple-50 text-purple-400 hover:bg-purple-100"
              }`}
            >
              {copied ? "✓ Copiado!" : "🔗 Partilhar"}
            </button>
          )}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-sm font-bold hover:bg-purple-200 active:scale-90 transition-all"
          >
            {showCreate ? "×" : "+"}
          </button>
        </div>
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

      {/* My events (registered / all in app mode) */}
      {myEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          expanded={expandedId === event.id}
          onToggleExpand={() =>
            setExpandedId(expandedId === event.id ? null : event.id)
          }
          onMarkDone={() => update(event.id, { done: true })}
          onDelete={() => remove(event.id)}
          onUpdateEvent={(data) => update(event.id, data)}
        />
      ))}

      {/* Available events to join (public mode only) */}
      {availableEvents.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-purple-100/40">
          <p className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
            Eventos disponíveis
          </p>
          {availableEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white/60 rounded-2xl border border-purple-100/30 p-3.5 flex items-center gap-3"
            >
              <span className="text-lg">🎉</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rose-700 truncate">
                  {event.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {event.date && (
                    <span className="text-[11px] text-purple-400">
                      📅 {event.date}
                    </span>
                  )}
                  {(event.participants || []).length > 0 && (
                    <span className="text-[11px] text-purple-400">
                      👥 {(event.participants || []).length}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleJoin(event)}
                className="text-[11px] bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1.5 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all"
              >
                Participar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Past events with clone */}
      {pastEvents.length > 0 && (
        <details className="group">
          <summary className="text-[11px] text-pink-300 cursor-pointer hover:text-pink-400 transition-colors list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Eventos passados ({pastEvents.length})
          </summary>
          <div className="mt-2 space-y-2">
            {pastEvents.map((event) => (
              <PastEventCard
                key={event.id}
                event={event}
                onClone={() => handleClone(event)}
                onDelete={() => remove(event.id)}
              />
            ))}
          </div>
        </details>
      )}

      {myEvents.length === 0 && availableEvents.length === 0 && !showCreate && pastEvents.length === 0 && (
        <p className="text-center text-xs text-pink-300 py-3">
          Sem eventos — toca no + para criar
        </p>
      )}
    </div>
  );
}

// ─── Past Event Card (with clone + history) ──────────────────

function PastEventCard({
  event,
  onClone,
  onDelete,
}: {
  event: CasaEvent;
  onClone: () => void;
  onDelete: () => void;
}) {
  const { items } = useCollection<EventItem>(`events/${event.id}/items`);
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
    } catch { return d; }
  };

  return (
    <div className="bg-pink-50/60 rounded-2xl border border-pink-100/40 overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-pink-300 transition-transform"
          style={{ transform: expanded ? "rotate(90deg)" : "" }}
        >
          ▶
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-pink-500 font-medium truncate block">
            {event.title}
          </span>
          <div className="flex gap-2">
            {event.date && (
              <span className="text-[10px] text-pink-300">{formatDate(event.date)}</span>
            )}
            {event.guests > 0 && (
              <span className="text-[10px] text-pink-300">👥 {event.guests}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClone}
          className="text-[10px] bg-purple-100 text-purple-500 px-2 py-1 rounded-lg hover:bg-purple-200 active:scale-90 transition-all"
        >
          📋 Clonar
        </button>
        <button
          onClick={onDelete}
          className="text-pink-200 hover:text-red-400 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Expanded: show completed items for reference */}
      {expanded && items.length > 0 && (
        <div className="px-3 pb-2.5 border-t border-pink-100/30 pt-2 space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-pink-400">
              <span>{item.type === "compra" ? "🛒" : "✅"}</span>
              <span className={item.done ? "line-through opacity-60" : ""}>
                {item.name}
              </span>
              {item.done && <span className="text-[9px] text-green-400">✓</span>}
            </div>
          ))}
        </div>
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
  onUpdateEvent: (data: Partial<CasaEvent>) => void;
}

function EventCard({
  event,
  expanded,
  onToggleExpand,
  onMarkDone,
  onDelete,
  onUpdateEvent,
}: EventCardProps) {
  const { items, add, update, remove } = useCollection<EventItem>(
    `events/${event.id}/items`
  );
  const [newItem, setNewItem] = useState("");
  const [newType, setNewType] = useState<"compra" | "todo">("compra");
  const [newAssignee, setNewAssignee] = useState("");
  const [newParticipant, setNewParticipant] = useState("");
  const weather = useEventWeather(event.date);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await add({
      name: newItem.trim(),
      done: false,
      type: newType,
      ...(newAssignee ? { assignee: newAssignee } : {}),
    } as unknown as Omit<EventItem, "id">);
    setNewItem("");
    setNewAssignee("");
  };

  const addParticipant = () => {
    if (!newParticipant.trim()) return;
    const participants = event.participants || [];
    if (!participants.includes(newParticipant.trim())) {
      onUpdateEvent({ participants: [...participants, newParticipant.trim()] });
    }
    setNewParticipant("");
  };

  const removeParticipant = (name: string) => {
    const participants = (event.participants || []).filter((p) => p !== name);
    onUpdateEvent({ participants });
  };

  const participants = event.participants || [];
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
            {weather && (
              <span className="text-[11px] text-purple-400" title={getWeatherInfo(weather.weathercode).label}>
                {getWeatherInfo(weather.weathercode).emoji} {weather.tempMin}°-{weather.tempMax}°
                {weather.precipProb > 30 && <span className="text-blue-400"> 💧{weather.precipProb}%</span>}
              </span>
            )}
            {(participants.length > 0 || event.guests > 0) && (
              <span className="text-[11px] text-purple-400">
                👥 {participants.length}{event.guests > 0 ? `/${event.guests}` : ""}
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
          {/* Participants */}
          <div>
            <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1.5">
              👥 Participantes ({participants.length}{event.guests > 0 ? `/${event.guests} esperados` : ""})
            </p>
            {/* Expected guests control */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-purple-400">Esperados:</span>
              <button
                onClick={() => onUpdateEvent({ guests: Math.max(0, (event.guests || 0) - 1) })}
                className="w-7 h-7 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center text-sm font-bold hover:bg-purple-200 active:scale-90 transition-all"
              >
                −
              </button>
              <span className="text-sm font-semibold text-purple-600 min-w-[20px] text-center">
                {event.guests || 0}
              </span>
              <button
                onClick={() => onUpdateEvent({ guests: (event.guests || 0) + 1 })}
                className="w-7 h-7 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center text-sm font-bold hover:bg-purple-200 active:scale-90 transition-all"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {participants.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 bg-purple-100 text-purple-600 text-[11px] px-2 py-1 rounded-full"
                >
                  {p}
                  <button
                    onClick={() => removeParticipant(p)}
                    className="text-purple-300 hover:text-red-400 text-[10px]"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                placeholder="Adicionar pessoa..."
                className="flex-1 rounded-lg border border-purple-200/60 bg-white/80 px-2.5 py-1.5 text-xs text-rose-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 transition-all"
              />
              <button
                onClick={addParticipant}
                disabled={!newParticipant.trim()}
                className="rounded-lg bg-purple-100 px-2.5 text-purple-500 text-xs font-bold hover:bg-purple-200 active:scale-90 transition-all disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {/* Add item */}
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "compra" | "todo")}
                className="rounded-xl border border-purple-200/60 bg-white/80 px-2 py-2 text-xs text-purple-600 focus:outline-none"
              >
                <option value="compra">🛒 Compra</option>
                <option value="todo">✅ Tarefa</option>
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
            {participants.length > 0 && (
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="rounded-lg border border-purple-200/60 bg-white/80 px-2 py-1.5 text-xs text-purple-600 focus:outline-none"
              >
                <option value="">Sem responsável</option>
                {participants.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}
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
                    participants={participants}
                    onToggle={() => update(item.id, { done: !item.done })}
                    onAssign={(assignee) => update(item.id, { assignee })}
                    onDelete={() => remove(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Task items */}
          {todos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1.5">
                ✅ Tarefas
              </p>
              <div className="space-y-1">
                {todos.map((item) => (
                  <SubItem
                    key={item.id}
                    item={item}
                    participants={participants}
                    onToggle={() => update(item.id, { done: !item.done })}
                    onAssign={(assignee) => update(item.id, { assignee })}
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
  participants,
  onToggle,
  onAssign,
  onDelete,
}: {
  item: EventItem;
  participants?: string[];
  onToggle: () => void;
  onAssign?: (assignee: string) => void;
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
      {/* Assignee badge / selector */}
      {participants && participants.length > 0 && onAssign && (
        <select
          value={item.assignee || ""}
          onChange={(e) => onAssign(e.target.value)}
          className="text-[10px] bg-purple-50 text-purple-500 border-none rounded-full px-1.5 py-0.5 focus:outline-none max-w-[80px]"
        >
          <option value="">—</option>
          {participants.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}
      {item.assignee && (!participants || participants.length === 0) && (
        <span className="text-[10px] bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">
          {item.assignee}
        </span>
      )}
      <button
        onClick={onDelete}
        className="text-purple-200 hover:text-red-400 text-xs transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
