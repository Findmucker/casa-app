"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Items from the handwritten notes - organized into projects and coisinhas

const PROJECTS: Array<{
  name: string;
  notes?: string;
  budget?: number;
  subtasks?: Array<{ id: string; name: string; done: boolean }>;
}> = [
  {
    name: "Pintar casa (interior)",
    notes: "Pintar todas as divisões interiores",
    subtasks: [
      { id: "s1", name: "Casa principal", done: false },
      { id: "s2", name: "Sala", done: false },
      { id: "s3", name: "Churrasqueira", done: false },
    ],
  },
  {
    name: "Pintar casa (exterior)",
    notes: "Pintura exterior completa da casa",
  },
  {
    name: "Colocar chão isolante no terraço e escadas para o sótão",
    notes: "Chão isolante para melhorar conforto térmico",
  },
  {
    name: "Portão grande eléctrico",
    notes: "Automatizar o portão grande da entrada",
  },
  {
    name: "Portadas eléctricas",
    notes: "Instalar portadas eléctricas nas janelas",
  },
  {
    name: "Comprar galinheira",
    notes: "Galinheira para o exterior",
    budget: 350,
  },
  {
    name: "Arranjar calhas de escoamento da chuva",
    notes: "Reparar sistema de escoamento de águas pluviais",
  },
  {
    name: "Arranjar telhado/telhas",
    notes: "Reparação de telhas partidas ou deslocadas",
  },
  {
    name: "Arranjar teto falso da sala",
    notes: "Reparar ou substituir o teto falso na sala",
  },
  {
    name: "Trocar janela/porta grande da sala",
    notes: "Substituir por janela/porta nova — orçamento 800€ a 1000€",
    budget: 900,
  },
  {
    name: "Trocar porta de entrada para entrar mais luz no hall",
    notes: "Porta com vidro ou material translúcido para iluminação natural",
  },
  {
    name: "Tapar lareira com recuperador de calor",
    notes: "Instalar recuperador de calor na lareira existente",
  },
  {
    name: "Comprar e instalar exaustor na cozinha",
    notes: "Exaustor novo para a cozinha",
  },
  {
    name: "Comprar armário igual ao branco da cozinha",
    notes: "Armário adicional para a cozinha, mesmo estilo do existente",
  },
  {
    name: "Pintar móveis da cozinha de branco e puxadores de preto",
    notes: "Renovar visual da cozinha — móveis brancos, puxadores pretos",
  },
  {
    name: "Analisar forma de criar garagem",
    notes: "Estudar viabilidade e opções para construir garagem",
  },
];

const COISINHAS: Array<{
  name: string;
  category: string;
  notes?: string;
}> = [
  { name: "Tábua de corte da cozinha", category: "🍳 Cozinha", notes: "Tábua nova de qualidade" },
];

export default function SeedPage() {
  const [status, setStatus] = useState<string>("Pronto para inserir");
  const [done, setDone] = useState(false);

  const seed = async () => {
    setStatus("A inserir projetinhos...");

    try {
      // Insert projects
      for (let i = 0; i < PROJECTS.length; i++) {
        const p = PROJECTS[i];
        await addDoc(collection(db, "priorities_big"), {
          name: p.name,
          status: "pendente",
          order: i + 100, // high order to not conflict with existing
          notes: p.notes || "",
          budget: p.budget || 0,
          spent: 0,
          subtasks: p.subtasks || [],
          createdAt: serverTimestamp(),
        });
        setStatus(`Projetinho ${i + 1}/${PROJECTS.length}: ${p.name}`);
      }

      // Insert coisinhas
      setStatus("A inserir coisinhas...");
      for (let i = 0; i < COISINHAS.length; i++) {
        const c = COISINHAS[i];
        await addDoc(collection(db, "priorities_small"), {
          name: c.name,
          done: false,
          order: 1000 + i,
          category: c.category,
          assignee: "ambos",
          notes: c.notes || "",
          createdAt: serverTimestamp(),
        });
        setStatus(`Coisinha ${i + 1}/${COISINHAS.length}: ${c.name}`);
      }

      setStatus(`✅ Tudo inserido! ${PROJECTS.length} projetinhos + ${COISINHAS.length} coisinhas`);
      setDone(true);
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-2xl font-bold text-rose-500">🌱 Seed — Inserir items das notas</h1>

      <div className="bg-white/80 rounded-2xl p-6 shadow-md max-w-lg w-full">
        <h2 className="font-semibold text-rose-600 mb-2">Projetinhos ({PROJECTS.length})</h2>
        <ul className="text-sm text-rose-700 space-y-1 mb-4">
          {PROJECTS.map((p, i) => (
            <li key={i}>• {p.name}</li>
          ))}
        </ul>

        <h2 className="font-semibold text-rose-600 mb-2">Coisinhas ({COISINHAS.length})</h2>
        <ul className="text-sm text-rose-700 space-y-1">
          {COISINHAS.map((c, i) => (
            <li key={i}>• {c.name} ({c.category})</li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-pink-500">{status}</p>

      {!done && (
        <button
          onClick={seed}
          className="bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold px-8 py-3 rounded-2xl shadow-md hover:from-pink-500 hover:to-rose-500 active:scale-95 transition-all"
        >
          🚀 Inserir tudo!
        </button>
      )}

      {done && (
        <a
          href="/dashboard"
          className="bg-gradient-to-r from-green-400 to-emerald-400 text-white font-bold px-8 py-3 rounded-2xl shadow-md active:scale-95 transition-all"
        >
          ✅ Ir para o Dashboard
        </a>
      )}
    </div>
  );
}
