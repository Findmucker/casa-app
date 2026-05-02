"use client";

import { useState, useContext } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HouseIdContext } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { guessCategory, SHOPPING_CATEGORIES, COISINHAS_CATEGORIES, PROJECTS_CATEGORIES } from "@/lib/categories";
import { seedTestAccount } from "@/lib/seed";

// Manual overrides for items that guessCategory can't catch
const SHOPPING_OVERRIDES: Record<string, string> = {};

const COISINHAS_OVERRIDES: Record<string, string> = {
  "Tábua de corte da cozinha": "🍳 Cozinha",
  "tábua de corte": "🍳 Cozinha",
};

const PROJECTS_OVERRIDES: Record<string, string> = {
  "Pintar casa (interior)": "🎨 Pintura",
  "Pintar casa (exterior)": "🎨 Pintura",
  "Pintar móveis da cozinha de branco e puxadores de preto": "🍳 Cozinha",
  "Colocar chão isolante no terraço e escadas para o sótão": "🏗️ Obras & Estrutura",
  "Portão grande eléctrico": "⚡ Eletricidade & Automação",
  "Portadas eléctricas": "⚡ Eletricidade & Automação",
  "Comprar galinheira": "🏡 Exterior",
  "Arranjar calhas de escoamento da chuva": "🔧 Reparações",
  "Arranjar telhado/telhas": "🔧 Reparações",
  "Arranjar teto falso da sala": "🔧 Reparações",
  "Trocar janela/porta grande da sala": "🚪 Portas & Janelas",
  "Trocar porta de entrada para entrar mais luz no hall": "🚪 Portas & Janelas",
  "Tapar lareira com recuperador de calor": "🔥 Aquecimento",
  "Comprar e instalar exaustor na cozinha": "🍳 Cozinha",
  "Comprar armário igual ao branco da cozinha": "🍳 Cozinha",
  "Analisar forma de criar garagem": "🏗️ Obras & Estrutura",
};

function getBestCategory(name: string, categories: Record<string, string[]>, overrides: Record<string, string>): string {
  if (overrides[name]) return overrides[name];
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(overrides)) {
    if (key.toLowerCase() === lower) return val;
  }
  return guessCategory(name, categories);
}

interface MaintenancePanelProps {
  onClose: () => void;
}

export default function MaintenancePanel({ onClose }: MaintenancePanelProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const houseId = useContext(HouseIdContext);
  const { user } = useAuth();

  const migrateToHouse = async () => {
    if (!houseId) { setStatus("❌ Sem casa configurada"); return; }
    setRunning(true);
    setStatus("A migrar dados para a casa...");
    let migrated = 0;

    try {
      const collections = ["shopping", "priorities_small", "priorities_big", "habits", "habit_checks", "expenses", "meal_plans"];
      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          await setDoc(doc(db, "houses", houseId, colName, d.id), d.data());
          migrated++;
        }
      }
      setStatus(`✅ ${migrated} items migrados para a casa!`);
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
    setRunning(false);
  };

  const fixCategories = async () => {
    setRunning(true);
    setStatus("A corrigir categorias...");
    let fixed = 0;

    try {
      // Fix shopping
      const sSnap = await getDocs(query(collection(db, "shopping"), orderBy("createdAt", "desc")));
      for (const d of sSnap.docs) {
        const data = d.data();
        const best = getBestCategory(data.name, SHOPPING_CATEGORIES, SHOPPING_OVERRIDES);
        if (data.category !== best) {
          await updateDoc(doc(db, "shopping", d.id), { category: best });
          fixed++;
        }
      }

      // Fix coisinhas
      const cSnap = await getDocs(query(collection(db, "priorities_small"), orderBy("order", "asc")));
      for (const d of cSnap.docs) {
        const data = d.data();
        const best = getBestCategory(data.name, COISINHAS_CATEGORIES, COISINHAS_OVERRIDES);
        if (data.category !== best) {
          await updateDoc(doc(db, "priorities_small", d.id), { category: best });
          fixed++;
        }
      }

      // Fix projects
      const pSnap = await getDocs(query(collection(db, "priorities_big"), orderBy("order", "asc")));
      for (const d of pSnap.docs) {
        const data = d.data();
        const best = getBestCategory(data.name, PROJECTS_CATEGORIES, PROJECTS_OVERRIDES);
        if (data.category !== best) {
          await updateDoc(doc(db, "priorities_big", d.id), { category: best });
          fixed++;
        }
      }

      setStatus(fixed > 0 ? `✅ ${fixed} categorias corrigidas!` : "✅ Tudo já estava correto!");
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
    setRunning(false);
  };

  const clearDone = async () => {
    setRunning(true);
    setStatus("A limpar items comprados...");
    let removed = 0;

    try {
      const { deleteDoc: delDoc } = await import("firebase/firestore");
      const sSnap = await getDocs(query(collection(db, "shopping"), orderBy("createdAt", "desc")));
      for (const d of sSnap.docs) {
        if (d.data().done) {
          await delDoc(doc(db, "shopping", d.id));
          removed++;
        }
      }
      setStatus(removed > 0 ? `✅ ${removed} comprinhas já compradas removidas!` : "✅ Nada para limpar!");
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
    setRunning(false);
  };

  const clearDoneCoisinhas = async () => {
    setRunning(true);
    setStatus("A limpar coisinhas feitas...");
    let removed = 0;

    try {
      const { deleteDoc: delDoc } = await import("firebase/firestore");
      const cSnap = await getDocs(query(collection(db, "priorities_small"), orderBy("order", "asc")));
      for (const d of cSnap.docs) {
        if (d.data().done) {
          await delDoc(doc(db, "priorities_small", d.id));
          removed++;
        }
      }
      setStatus(removed > 0 ? `✅ ${removed} coisinhas feitas removidas!` : "✅ Nada para limpar!");
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
    setRunning(false);
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in-up p-6">
      <h2 className="text-lg font-bold text-rose-500 mb-6">⚙️ Manutenção</h2>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={fixCategories}
          disabled={running}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 border border-pink-100/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <span className="text-xl">🗂️</span>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-rose-700">Reorganizar categorias</p>
            <p className="text-[11px] text-pink-400">Re-classifica todos os items automaticamente</p>
          </div>
        </button>

        <button
          onClick={clearDone}
          disabled={running}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 border border-pink-100/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <span className="text-xl">🧹</span>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-rose-700">Limpar comprinhas feitas</p>
            <p className="text-[11px] text-pink-400">Remove items já comprados da lista</p>
          </div>
        </button>

        <button
          onClick={clearDoneCoisinhas}
          disabled={running}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 border border-pink-100/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <span className="text-xl">✨</span>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-rose-700">Limpar coisinhas feitas</p>
            <p className="text-[11px] text-pink-400">Remove coisinhas já concluídas</p>
          </div>
        </button>

        {houseId && (
          <button
            onClick={migrateToHouse}
            disabled={running}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 border border-pink-100/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span className="text-xl">📦</span>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-rose-700">Migrar dados para a casa</p>
              <p className="text-[11px] text-pink-400">Copia dados antigos para a casa atual</p>
            </div>
          </button>
        )}

        {houseId && user && (
          <button
            onClick={async () => {
              setRunning(true);
              setStatus("A preencher dados de teste...");
              try {
                const owner = user.displayName || user.email || "user";
                await seedTestAccount(owner, houseId);
                setStatus("✅ Conta preenchida com dados de teste (max XP, tudo desbloqueado)!");
              } catch (e) {
                setStatus(`❌ Erro: ${e}`);
              }
              setRunning(false);
            }}
            disabled={running}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 border border-pink-100/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span className="text-xl">🎮</span>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-rose-700">Seed dados de teste</p>
              <p className="text-[11px] text-pink-400">Preenche com max XP, badges e dados exemplo</p>
            </div>
          </button>
        )}

        {houseId && user && (
          <button
            onClick={async () => {
              setRunning(true);
              setStatus("A limpar dados de teste...");
              try {
                const { deleteDoc: delDoc, getDocs: gDocs, collection: col } = await import("firebase/firestore");
                const owner = user.displayName || user.email || "user";
                // Reset gamification to zero
                await setDoc(doc(db, "gamification", owner), {
                  points: 0, totalCompleted: 0, maxStreak: 0,
                  shoppingDone: 0, coisinhasDone: 0, projectsDone: 0,
                  badges: [], lastAction: "reset", boxesOpened: 0,
                  inventory: [], equipped: {}, avatar: null,
                });
                // Delete seeded items (prefixed with seed_)
                const collections = ["shopping", "priorities_small", "priorities_big", "habits", "habit_checks", "expenses", "meal_plans"];
                let removed = 0;
                for (const colName of collections) {
                  const snap = await gDocs(col(db, "houses", houseId, colName));
                  for (const d of snap.docs) {
                    if (d.id.startsWith("seed_")) {
                      await delDoc(doc(db, "houses", houseId, colName, d.id));
                      removed++;
                    }
                  }
                }
                setStatus(`✅ Modo teste desactivado! ${removed} items de teste removidos, stats resetados a zero.`);
              } catch (e) {
                setStatus(`❌ Erro: ${e}`);
              }
              setRunning(false);
            }}
            disabled={running}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 border border-red-200/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span className="text-xl">🚪</span>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-red-600">Sair do modo teste</p>
              <p className="text-[11px] text-pink-400">Remove dados de teste e reseta XP/badges/inventário</p>
            </div>
          </button>
        )}
      </div>

      {status && (
        <p className="mt-4 text-sm text-pink-500 text-center">{status}</p>
      )}

      <button
        onClick={onClose}
        aria-label="Fechar manutenção"
        className="mt-8 text-sm text-pink-400 hover:text-pink-600 transition-colors"
      >
        Fechar
      </button>
    </div>
  );
}
