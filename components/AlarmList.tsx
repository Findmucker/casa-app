"use client";

import { useState } from "react";
import { useCollection } from "@/lib/hooks";

export interface Alarm {
  id: string;
  title: string;
  datetime: string; // ISO string
  repeat: "none" | "daily" | "weekly";
  active: boolean;
  owner: "eduardo" | "moniquinha";
  createdAt: unknown;
}

const OWNER_LABELS = {
  eduardo: "🧔 Eduardo",
  moniquinha: "👩 Moniquinha",
};

export default function AlarmList() {
  const { items, loading, add, update, remove } = useCollection<Alarm>(
    "alarms",
    "datetime"
  );

  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [owner, setOwner] = useState<"eduardo" | "moniquinha">("eduardo");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !datetime) return;
    await add({
      title: title.trim(),
      datetime,
      repeat,
      active: true,
      owner,
    } as unknown as Omit<Alarm, "id">);
    setTitle("");
    setDatetime("");
    setRepeat("none");
    setShowForm(false);
  };

  const toggleActive = async (alarm: Alarm) => {
    await update(alarm.id, { active: !alarm.active });
  };

  const formatDatetime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const isPast = (iso: string) => new Date(iso) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-pink-300 text-lg">A carregar alarmes...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-rose-400">⏰ Alarmes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-pink-100 w-8 h-8 flex items-center justify-center text-pink-500 font-bold text-lg hover:bg-pink-200 active:scale-90 transition-all"
        >
          {showForm ? "×" : "+"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100/60 p-4 space-y-3 animate-fade-in-up">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome do alarme..."
            className="w-full rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2.5 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 transition-all"
          />
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="w-full rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2.5 text-sm text-rose-800 focus:outline-none focus:border-pink-300 transition-all"
          />
          <div className="flex gap-2">
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as "none" | "daily" | "weekly")}
              className="flex-1 rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2.5 text-sm text-rose-800 focus:outline-none focus:border-pink-300"
            >
              <option value="none">Sem repetição</option>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
            </select>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value as "eduardo" | "moniquinha")}
              className="flex-1 rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2.5 text-sm text-rose-800 focus:outline-none focus:border-pink-300"
            >
              <option value="eduardo">🧔 Eduardo</option>
              <option value="moniquinha">👩 Moniquinha</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim() || !datetime}
            className="w-full rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white py-2.5 text-sm font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Criar alarme
          </button>
        </div>
      )}

      {/* Alarm list */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-12 text-pink-300">
          <p className="text-3xl mb-2">⏰</p>
          <p className="text-sm">Sem alarmes ainda</p>
          <p className="text-xs mt-1">Toca no + para criar um</p>
        </div>
      )}

      {items.map((alarm) => (
        <div
          key={alarm.id}
          className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100/60 p-3.5 transition-all ${
            !alarm.active ? "opacity-50" : ""
          } ${isPast(alarm.datetime) && alarm.repeat === "none" ? "border-gray-200" : ""}`}
        >
          <div className="flex items-center gap-3">
            {/* Toggle */}
            <button
              onClick={() => toggleActive(alarm)}
              className={`w-10 h-6 rounded-full transition-all relative ${
                alarm.active
                  ? "bg-gradient-to-r from-pink-400 to-rose-400"
                  : "bg-gray-200"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  alarm.active ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-700 truncate">
                {alarm.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-pink-400">
                  {formatDatetime(alarm.datetime)}
                </span>
                {alarm.repeat !== "none" && (
                  <span className="text-[10px] bg-pink-100 text-pink-500 px-1.5 py-0.5 rounded-full">
                    {alarm.repeat === "daily" ? "Diário" : "Semanal"}
                  </span>
                )}
                <span className="text-[10px] text-pink-300">
                  {OWNER_LABELS[alarm.owner]}
                </span>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => remove(alarm.id)}
              className="text-pink-300 hover:text-red-400 transition-colors text-lg"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
