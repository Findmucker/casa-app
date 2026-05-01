"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { guessCategory, SHOPPING_CATEGORIES, COISINHAS_CATEGORIES, PROJECTS_CATEGORIES } from "@/lib/categories";

interface Item {
  id: string;
  name: string;
  category?: string;
  [key: string]: unknown;
}

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
  // Check overrides first (exact match)
  if (overrides[name]) return overrides[name];
  // Check overrides (case-insensitive)
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(overrides)) {
    if (key.toLowerCase() === lower) return val;
  }
  // Fall back to guessCategory
  return guessCategory(name, categories);
}

export default function DebugPage() {
  const [status, setStatus] = useState("A auto-corrigir...");
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    autoFix();
  }, []);

  const autoFix = async () => {
    const logs: string[] = [];
    let fixed = 0;

    try {
      // Fix shopping
      const sSnap = await getDocs(query(collection(db, "shopping"), orderBy("createdAt", "desc")));
      for (const d of sSnap.docs) {
        const item = { id: d.id, ...d.data() } as Item;
        const best = getBestCategory(item.name, SHOPPING_CATEGORIES, SHOPPING_OVERRIDES);
        if (item.category !== best) {
          await updateDoc(doc(db, "shopping", item.id), { category: best });
          logs.push(`🛒 ${item.name}: ${item.category || "sem"} → ${best}`);
          fixed++;
        }
      }

      // Fix coisinhas
      const cSnap = await getDocs(query(collection(db, "priorities_small"), orderBy("order", "asc")));
      for (const d of cSnap.docs) {
        const item = { id: d.id, ...d.data() } as Item;
        const best = getBestCategory(item.name, COISINHAS_CATEGORIES, COISINHAS_OVERRIDES);
        if (item.category !== best) {
          await updateDoc(doc(db, "priorities_small", item.id), { category: best });
          logs.push(`🪴 ${item.name}: ${item.category || "sem"} → ${best}`);
          fixed++;
        }
      }

      // Fix projects
      const pSnap = await getDocs(query(collection(db, "priorities_big"), orderBy("order", "asc")));
      for (const d of pSnap.docs) {
        const item = { id: d.id, ...d.data() } as Item;
        const best = getBestCategory(item.name, PROJECTS_CATEGORIES, PROJECTS_OVERRIDES);
        if (item.category !== best) {
          await updateDoc(doc(db, "priorities_big", item.id), { category: best });
          logs.push(`🏠 ${item.name}: ${item.category || "sem"} → ${best}`);
          fixed++;
        }
      }

      // Report items still in "Outros"
      const stillOutros: string[] = [];
      for (const d of sSnap.docs) {
        const item = { id: d.id, ...d.data() } as Item;
        const cat = getBestCategory(item.name, SHOPPING_CATEGORIES, SHOPPING_OVERRIDES);
        if (cat === "📦 Outros") stillOutros.push(`🛒 ${item.name}`);
      }
      for (const d of cSnap.docs) {
        const item = { id: d.id, ...d.data() } as Item;
        const cat = getBestCategory(item.name, COISINHAS_CATEGORIES, COISINHAS_OVERRIDES);
        if (cat === "📦 Outros") stillOutros.push(`🪴 ${item.name}`);
      }
      for (const d of pSnap.docs) {
        const item = { id: d.id, ...d.data() } as Item;
        const cat = getBestCategory(item.name, PROJECTS_CATEGORIES, PROJECTS_OVERRIDES);
        if (cat === "📦 Outros") stillOutros.push(`🏠 ${item.name}`);
      }

      if (stillOutros.length > 0) {
        logs.push("");
        logs.push(`⚠️ Ainda em "Outros" (${stillOutros.length}):`);
        stillOutros.forEach((s) => logs.push(`  ${s}`));
      }

      if (fixed === 0 && stillOutros.length === 0) {
        setStatus("✅ Tudo já estava perfeito!");
      } else if (fixed > 0 && stillOutros.length === 0) {
        setStatus(`✅ Corrigido! ${fixed} categorias atualizadas. Zero items em "Outros"!`);
      } else {
        setStatus(`✅ ${fixed} corrigidos. ${stillOutros.length} ainda em "Outros" (ver abaixo).`);
      }
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
      logs.push(`Erro: ${e}`);
    }

    setLog(logs);
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-6">
      <h1 className="text-2xl font-bold text-rose-500 text-center mb-4">🗂️ Auto-organização</h1>
      <p className="text-sm text-pink-500 text-center mb-6">{status}</p>

      {log.length > 0 && (
        <div className="max-w-lg mx-auto bg-white/80 rounded-2xl p-4 shadow-sm">
          <pre className="text-xs text-rose-700 whitespace-pre-wrap">
            {log.join("\n")}
          </pre>
        </div>
      )}

      {done && (
        <div className="text-center mt-6">
          <a
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold px-8 py-3 rounded-2xl shadow-md active:scale-95 transition-all"
          >
            Ir para o Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
