"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { guessCategory, COISINHAS_CATEGORIES, PROJECTS_CATEGORIES } from "@/lib/categories";

interface Item {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Items that should be COISINHAS (small tasks/purchases) not projects:
const MOVE_TO_COISINHAS = [
  // Things you buy, not build/install projects
  "Tábua de corte da cozinha",
];

// Items that should be PROJECTS (big tasks) not coisinhas:
const MOVE_TO_PROJECTS: string[] = [];

// Category corrections for projects
const PROJECT_CATEGORY_FIXES: Record<string, string> = {
  "Pintar casa (interior)": "🎨 Pintura",
  "Pintar casa (exterior)": "🎨 Pintura",
  "Pintar móveis da cozinha de branco e puxadores de preto": "🎨 Pintura",
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

// Category corrections for coisinhas
const COISINHAS_CATEGORY_FIXES: Record<string, string> = {
  "Tábua de corte da cozinha": "🍳 Cozinha",
};

export default function OrganizarPage() {
  const [coisinhas, setCoisinhas] = useState<Item[]>([]);
  const [projetos, setProjetos] = useState<Item[]>([]);
  const [status, setStatus] = useState("A carregar...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const cSnap = await getDocs(query(collection(db, "priorities_small"), orderBy("order", "asc")));
    const pSnap = await getDocs(query(collection(db, "priorities_big"), orderBy("order", "asc")));
    setCoisinhas(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)));
    setProjetos(pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)));
    setStatus("Pronto para organizar");
  };

  const organizar = async () => {
    setStatus("A organizar...");
    let moved = 0;
    let fixed = 0;

    try {
      // 1. Move items from projects → coisinhas
      for (const proj of projetos) {
        if (MOVE_TO_COISINHAS.includes(proj.name)) {
          const cat = COISINHAS_CATEGORY_FIXES[proj.name] || guessCategory(proj.name, COISINHAS_CATEGORIES);
          await addDoc(collection(db, "priorities_small"), {
            name: proj.name,
            done: false,
            order: 999 + moved,
            category: cat,
            assignee: "ambos",
            notes: (proj.notes as string) || "",
            createdAt: serverTimestamp(),
          });
          await deleteDoc(doc(db, "priorities_big", proj.id));
          moved++;
          setStatus(`Movido para coisinhas: ${proj.name}`);
        }
      }

      // 2. Move items from coisinhas → projects
      for (const cois of coisinhas) {
        if (MOVE_TO_PROJECTS.includes(cois.name)) {
          const cat = PROJECT_CATEGORY_FIXES[cois.name] || guessCategory(cois.name, PROJECTS_CATEGORIES);
          await addDoc(collection(db, "priorities_big"), {
            name: cois.name,
            status: "pendente",
            order: 999 + moved,
            category: cat,
            notes: (cois.notes as string) || "",
            budget: 0,
            spent: 0,
            subtasks: [],
            createdAt: serverTimestamp(),
          });
          await deleteDoc(doc(db, "priorities_small", cois.id));
          moved++;
          setStatus(`Movido para projetinhos: ${cois.name}`);
        }
      }

      // 3. Fix project categories
      for (const proj of projetos) {
        if (PROJECT_CATEGORY_FIXES[proj.name] && proj.category !== PROJECT_CATEGORY_FIXES[proj.name]) {
          await updateDoc(doc(db, "priorities_big", proj.id), {
            category: PROJECT_CATEGORY_FIXES[proj.name],
          });
          fixed++;
          setStatus(`Categoria corrigida: ${proj.name} → ${PROJECT_CATEGORY_FIXES[proj.name]}`);
        }
      }

      // 4. Fix coisinhas categories
      for (const cois of coisinhas) {
        if (COISINHAS_CATEGORY_FIXES[cois.name] && cois.category !== COISINHAS_CATEGORY_FIXES[cois.name]) {
          await updateDoc(doc(db, "priorities_small", cois.id), {
            category: COISINHAS_CATEGORY_FIXES[cois.name],
          });
          fixed++;
          setStatus(`Categoria corrigida: ${cois.name} → ${COISINHAS_CATEGORY_FIXES[cois.name]}`);
        }
      }

      setStatus(`✅ Organizado! ${moved} movidos, ${fixed} categorias corrigidas.`);
      setDone(true);
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-6">
      <h1 className="text-2xl font-bold text-rose-500 text-center mb-6">🗂️ Organizar Coisinhas & Projetinhos</h1>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Current state */}
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-rose-600 mb-2">🪴 Coisinhas ({coisinhas.length})</h2>
          <ul className="text-xs text-rose-700 space-y-0.5 max-h-40 overflow-y-auto">
            {coisinhas.map((c) => (
              <li key={c.id}>• {c.name} <span className="text-pink-400">({(c.category as string) || "sem cat"})</span></li>
            ))}
          </ul>
        </div>

        <div className="bg-white/80 rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-rose-600 mb-2">🏠 Projetinhos ({projetos.length})</h2>
          <ul className="text-xs text-rose-700 space-y-0.5 max-h-40 overflow-y-auto">
            {projetos.map((p) => (
              <li key={p.id}>• {p.name} <span className="text-pink-400">({(p.category as string) || "sem cat"})</span></li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-rose-600 mb-2">O que vai ser feito:</h2>
          <ul className="text-xs text-rose-700 space-y-1">
            <li>✅ Corrigir categorias dos projetinhos (pintura, obras, etc.)</li>
            <li>✅ Mover "Tábua de corte" para coisinhas (é uma compra, não um projeto)</li>
          </ul>
        </div>

        <p className="text-sm text-pink-500 text-center">{status}</p>

        {!done && (
          <button
            onClick={organizar}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold px-8 py-3 rounded-2xl shadow-md hover:from-pink-500 hover:to-rose-500 active:scale-95 transition-all"
          >
            🗂️ Organizar tudo!
          </button>
        )}

        {done && (
          <a
            href="/dashboard"
            className="block text-center bg-gradient-to-r from-green-400 to-emerald-400 text-white font-bold px-8 py-3 rounded-2xl shadow-md active:scale-95 transition-all"
          >
            ✅ Ir para o Dashboard
          </a>
        )}
      </div>
    </div>
  );
}
