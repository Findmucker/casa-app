"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { guessCategory, SHOPPING_CATEGORIES, COISINHAS_CATEGORIES, PROJECTS_CATEGORIES } from "@/lib/categories";

interface Item {
  id: string;
  name: string;
  category?: string;
  [key: string]: unknown;
}

export default function DebugPage() {
  const [shopping, setShopping] = useState<Item[]>([]);
  const [coisinhas, setCoisinhas] = useState<Item[]>([]);
  const [projetos, setProjetos] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const sSnap = await getDocs(query(collection(db, "shopping"), orderBy("createdAt", "desc")));
      setShopping(sSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)));
      const cSnap = await getDocs(query(collection(db, "priorities_small"), orderBy("order", "asc")));
      setCoisinhas(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)));
      const pSnap = await getDocs(query(collection(db, "priorities_big"), orderBy("order", "asc")));
      setProjetos(pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)));
    })();
  }, []);

  const renderGroup = (items: Item[], categories: Record<string, string[]>, label: string) => {
    const inOutros = items.filter((i) => {
      const cat = i.category || guessCategory(i.name, categories);
      return cat === "📦 Outros";
    });
    const notOutros = items.filter((i) => {
      const cat = i.category || guessCategory(i.name, categories);
      return cat !== "📦 Outros";
    });

    return (
      <div className="bg-white/80 rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-rose-600 mb-2">{label} ({items.length} total, {inOutros.length} em Outros)</h2>
        {inOutros.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-red-500 mb-1">📦 Em &quot;Outros&quot; (precisam de categoria):</p>
            <ul className="text-xs text-red-700 space-y-0.5">
              {inOutros.map((i) => <li key={i.id}>• {i.name} (stored: {i.category || "nenhuma"})</li>)}
            </ul>
          </div>
        )}
        <p className="text-xs font-bold text-green-600 mb-1">✅ Categorizados ({notOutros.length}):</p>
        <ul className="text-xs text-rose-700 space-y-0.5 max-h-40 overflow-y-auto">
          {notOutros.map((i) => (
            <li key={i.id}>• {i.name} → {i.category || guessCategory(i.name, categories)}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-6">
      <h1 className="text-2xl font-bold text-rose-500 text-center mb-6">🔍 Debug Categorias</h1>
      <div className="max-w-lg mx-auto space-y-4">
        {renderGroup(shopping, SHOPPING_CATEGORIES, "🛒 Comprinhas")}
        {renderGroup(coisinhas, COISINHAS_CATEGORIES, "🪴 Coisinhas")}
        {renderGroup(projetos, PROJECTS_CATEGORIES, "🏠 Projetinhos")}
      </div>
    </div>
  );
}
