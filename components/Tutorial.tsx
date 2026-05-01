"use client";

import { useState } from "react";

const TUTORIAL_STEPS = [
  {
    emoji: "🏡",
    title: "Bem-vindo à Nossa Casinha!",
    text: "A app que organiza a vida a dois. Compras, tarefas, hábitos, despesas e mais — tudo num sítio fofo.",
  },
  {
    emoji: "🛒",
    title: "Comprinhas",
    text: "A lista de compras partilhada. Adiciona items, marca urgentes, e eles organizam-se por categoria automaticamente. Marca como comprado quando fores ao supermercado!",
  },
  {
    emoji: "🪴",
    title: "Coisinhas",
    text: "Tarefas pequenas do dia-a-dia. Atribui a alguém, adiciona notas, e completa para ganhar pontos. Auto-categorização por tipo.",
  },
  {
    emoji: "🏠",
    title: "Projetinhos",
    text: "Projetos maiores da casa — obras, pinturas, reparações. Com subtarefas, orçamento, e status (Pendente → A fazer → Feito).",
  },
  {
    emoji: "💊",
    title: "Rotinazinhas",
    text: "Hábitos diários com streak. Configura a hora e recebe notificações. O streak conta os dias seguidos que completas!",
  },
  {
    emoji: "💰",
    title: "Gastinhos",
    text: "Tracking de despesas. Vê quanto gastaste por mês, por categoria, e por pessoa. Sem complicações.",
  },
  {
    emoji: "🍽️",
    title: "Receitinhas",
    text: "Planeia refeições da semana. Clica para enviar ingredientes direto para as Comprinhas!",
  },
  {
    emoji: "📅",
    title: "Calendarzinho",
    text: "Vista mensal com bolinhas coloridas de hábitos, tarefas e eventos. Toca num dia para ver detalhes.",
  },
  {
    emoji: "🏆",
    title: "Perfil RPG & Gamificação",
    text: "Cada tarefa dá XP! Sobe de nível, desbloqueia equipamentos, coleciona badges, e recebe loot aleatório. Quanto mais fazes, mais forte ficas!",
  },
  {
    emoji: "💡",
    title: "Dicas",
    text: "• Swipe para mudar de tab\n• Toca no título para o menu rápido\n• 🔍 para pesquisar em tudo\n• 🏆 para o teu perfil RPG\n• Dark mode muda com o sol!",
  },
];

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 z-50 flex flex-col items-center justify-center animate-fade-in-up p-6">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {TUTORIAL_STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? "bg-amber-400 scale-125" : i < step ? "bg-purple-400" : "bg-purple-800"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-purple-900/40 border border-purple-700/40 rounded-3xl p-6 text-center shadow-xl">
        <span className="text-5xl block mb-4">{current.emoji}</span>
        <h3 className="text-lg font-bold text-white mb-2">{current.title}</h3>
        <p className="text-sm text-purple-200 leading-relaxed whitespace-pre-line">{current.text}</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-6">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-5 py-2 rounded-full bg-purple-800/50 text-purple-300 text-sm font-medium hover:bg-purple-700/50 transition-all"
          >
            Anterior
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95 transition-all"
          >
            Seguinte
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95 transition-all"
          >
            Começar!
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="mt-4 text-xs text-purple-500 hover:text-purple-300 transition-colors"
      >
        Saltar tutorial
      </button>
    </div>
  );
}
