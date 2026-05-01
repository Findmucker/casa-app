"use client";

import { useState } from "react";
import {
  useCollection,
  type BigPriorityItem,
  type Subtask,
} from "@/lib/hooks";

const STATUS_LABELS = {
  pendente: { label: "Pendente", color: "bg-purple-100/80 text-purple-500", emoji: "💜" },
  "em progresso": { label: "A fazer", color: "bg-blue-100/80 text-blue-400", emoji: "🔧" },
  concluido: { label: "Feito!", color: "bg-green-100/80 text-green-500", emoji: "✨" },
};

export default function ProjectList() {
  const { items, loading, add, update, remove } = useCollection<BigPriorityItem>(
    "priorities_big",
    "order"
  );
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [fieldValue, setFieldValue] = useState("");

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0;
    await add({
      name,
      status: "pendente",
      order: maxOrder + 1,
      notes: "",
      budget: 0,
      spent: 0,
      subtasks: [],
    } as unknown as Omit<BigPriorityItem, "id">);
    setNewName("");
  };

  const moveItem = async (item: BigPriorityItem, direction: "up" | "down") => {
    const idx = items.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];
    await update(item.id, { order: other.order });
    await update(other.id, { order: item.order });
  };

  const cycleStatus = async (item: BigPriorityItem) => {
    const cycle: Array<"pendente" | "em progresso" | "concluido"> = [
      "pendente", "em progresso", "concluido",
    ];
    const next = cycle[(cycle.indexOf(item.status) + 1) % 3];
    await update(item.id, { status: next });
  };

  const addSubtask = async (item: BigPriorityItem) => {
    const name = newSubtask.trim();
    if (!name) return;
    const subtasks = [...(item.subtasks || []), { id: Date.now().toString(), name, done: false }];
    await update(item.id, { subtasks });
    setNewSubtask("");
  };

  const toggleSubtask = async (item: BigPriorityItem, subtaskId: string) => {
    const subtasks = (item.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    await update(item.id, { subtasks });
  };

  const removeSubtask = async (item: BigPriorityItem, subtaskId: string) => {
    const subtasks = (item.subtasks || []).filter((st) => st.id !== subtaskId);
    await update(item.id, { subtasks });
  };

  const startEdit = (id: string, field: string, value: string) => {
    setEditingField({ id, field });
    setFieldValue(value);
  };

  const saveField = async (item: BigPriorityItem) => {
    if (!editingField) return;
    const val = editingField.field === "notes" ? fieldValue : parseFloat(fieldValue) || 0;
    await update(item.id, { [editingField.field]: val });
    setEditingField(null);
    setFieldValue("");
  };

  const getSubtaskProgress = (item: BigPriorityItem) => {
    const subs = item.subtasks || [];
    if (subs.length === 0) return null;
    const done = subs.filter((s) => s.done).length;
    return { done, total: subs.length };
  };

  const getBudgetPercent = (item: BigPriorityItem) => {
    if (!item.budget || item.budget === 0) return 0;
    return Math.min(100, Math.round(((item.spent || 0) / item.budget) * 100));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add form */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-pink-100/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Novo projeto..."
            className="flex-1 rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 py-3 text-white font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-95 transition-all disabled:opacity-30 shadow-sm shadow-pink-200/50"
          >
            +
          </button>
        </div>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center text-pink-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">🏡</div>
            <p className="text-sm">A carregar...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center text-pink-300 py-12">
            <div className="text-5xl mb-3 animate-float">🏡</div>
            <p className="text-sm">Nenhum projetinho ainda!</p>
            <p className="text-xs text-pink-200 mt-1">Adiciona algo em cima</p>
          </div>
        )}

        {items.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const progress = getSubtaskProgress(item);
          const budgetPct = getBudgetPercent(item);
          const statusInfo = STATUS_LABELS[item.status];

          return (
            <div
              key={item.id}
              className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm shadow-pink-100/30 border border-pink-100/30 transition-all overflow-hidden ${
                item.status === "concluido" ? "opacity-50" : ""
              }`}
            >
              {/* Header row */}
              <div className="p-4 pb-2">
                <div className="flex items-start gap-2">
                  {/* Priority + arrows */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-lg font-bold text-pink-200 w-5 text-center">{idx + 1}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(item, "up")}
                        disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-pink-50 text-xs text-pink-400 hover:bg-pink-100 disabled:opacity-20 active:scale-90 transition-all"
                      >▲</button>
                      <button
                        onClick={() => moveItem(item, "down")}
                        disabled={idx === items.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-pink-50 text-xs text-pink-400 hover:bg-pink-100 disabled:opacity-20 active:scale-90 transition-all"
                      >▼</button>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Status + name */}
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => cycleStatus(item)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 flex-shrink-0 ${statusInfo.color}`}
                      >
                        {statusInfo.emoji} {statusInfo.label}
                      </button>
                    </div>
                    <h3 className="text-base font-semibold text-rose-800 break-words leading-snug">
                      {item.name}
                    </h3>

                    {/* Meta info line */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {(item.budget || 0) > 0 && (
                        <span className="text-[11px] text-pink-400">
                          💰 {item.spent || 0}€/{item.budget}€
                        </span>
                      )}
                      {progress && (
                        <span className="text-[11px] text-pink-400">
                          📋 {progress.done}/{progress.total} feitas
                        </span>
                      )}
                      {item.notes && !isExpanded && (
                        <span className="text-[11px] text-pink-300">📝 Tem notas</span>
                      )}
                    </div>
                  </div>

                  {/* Delete button - top right, never overlapping text */}
                  <button
                    onClick={() => remove(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-pink-50 text-pink-300 hover:bg-red-50 hover:text-red-400 transition-all active:scale-90 text-sm flex-shrink-0"
                  >✕</button>
                </div>
              </div>

              {/* Expand toggle */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full py-2 text-xs text-pink-400 hover:text-pink-600 transition-colors flex items-center justify-center gap-1 border-t border-pink-50"
              >
                <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                {isExpanded ? "Fechar" : "Detalhes"}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-pink-100/30 animate-expand">
                  {/* Budget section */}
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">💰 Orçamento</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-pink-300 mb-1 block">Orçamento</label>
                        {editingField?.id === item.id && editingField.field === "budget" ? (
                          <input
                            type="number"
                            value={fieldValue}
                            onChange={(e) => setFieldValue(e.target.value)}
                            onBlur={() => saveField(item)}
                            onKeyDown={(e) => e.key === "Enter" && saveField(item)}
                            className="w-full rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 focus:outline-none focus:border-pink-300 transition-all"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => startEdit(item.id, "budget", String(item.budget || 0))}
                            className="w-full rounded-xl bg-pink-50/80 px-3 py-2 text-sm text-rose-700 text-left hover:bg-pink-100/80 transition-all"
                          >
                            {item.budget || 0}€
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-pink-300 mb-1 block">Já gasto</label>
                        {editingField?.id === item.id && editingField.field === "spent" ? (
                          <input
                            type="number"
                            value={fieldValue}
                            onChange={(e) => setFieldValue(e.target.value)}
                            onBlur={() => saveField(item)}
                            onKeyDown={(e) => e.key === "Enter" && saveField(item)}
                            className="w-full rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 focus:outline-none focus:border-pink-300 transition-all"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => startEdit(item.id, "spent", String(item.spent || 0))}
                            className="w-full rounded-xl bg-pink-50/80 px-3 py-2 text-sm text-rose-700 text-left hover:bg-pink-100/80 transition-all"
                          >
                            {item.spent || 0}€
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    {(item.budget || 0) > 0 && (
                      <div className="mt-2">
                        <div className="h-2 rounded-full bg-pink-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              budgetPct > 90 ? "bg-red-400" : budgetPct > 60 ? "bg-amber-400" : "bg-gradient-to-r from-pink-300 to-rose-300"
                            }`}
                            style={{ width: `${budgetPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-pink-300 mt-1 text-right">{budgetPct}% gasto</p>
                      </div>
                    )}
                  </div>

                  {/* Subtasks section */}
                  <div>
                    <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">📋 Sub-tarefas</p>
                    <div className="space-y-1.5">
                      {(item.subtasks || []).map((st) => (
                        <div key={st.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => toggleSubtask(item, st.id)}
                            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs transition-all active:scale-90 ${
                              st.done
                                ? "bg-gradient-to-r from-pink-300 to-rose-300 border-pink-300 text-white"
                                : "border-pink-300 hover:bg-pink-100"
                            }`}
                          >
                            {st.done ? "✓" : ""}
                          </button>
                          <span className={`flex-1 text-sm ${st.done ? "line-through text-pink-300" : "text-rose-700"}`}>
                            {st.name}
                          </span>
                          <button
                            onClick={() => removeSubtask(item, st.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-pink-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                    {/* Add subtask */}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={expandedId === item.id ? newSubtask : ""}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSubtask(item)}
                        placeholder="Nova sub-tarefa..."
                        className="flex-1 rounded-xl border border-pink-200/40 bg-white/60 px-3 py-2 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 transition-all"
                      />
                      <button
                        onClick={() => addSubtask(item)}
                        disabled={!newSubtask.trim()}
                        className="rounded-xl bg-pink-100 px-3 py-2 text-pink-500 text-sm font-medium hover:bg-pink-200 active:scale-95 transition-all disabled:opacity-30"
                      >+</button>
                    </div>
                  </div>

                  {/* Notes section */}
                  <div>
                    <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">📝 Notas</p>
                    {editingField?.id === item.id && editingField.field === "notes" ? (
                      <div>
                        <textarea
                          value={fieldValue}
                          onChange={(e) => setFieldValue(e.target.value)}
                          placeholder="Notas sobre este projeto..."
                          className="w-full rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 resize-none transition-all"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveField(item)}
                            className="text-xs bg-gradient-to-r from-pink-400 to-rose-400 text-white px-4 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all"
                          >Guardar</button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="text-xs text-pink-400 px-3 py-1.5 hover:text-pink-600 transition-colors"
                          >Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(item.id, "notes", item.notes || "")}
                        className="w-full rounded-xl bg-pink-50/80 px-3 py-2.5 text-sm text-left hover:bg-pink-100/80 transition-all min-h-[40px]"
                      >
                        {item.notes ? (
                          <span className="text-rose-700 whitespace-pre-wrap">{item.notes}</span>
                        ) : (
                          <span className="text-pink-300 italic">Toca para adicionar notas...</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
