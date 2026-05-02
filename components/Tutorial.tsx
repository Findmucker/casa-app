"use client";

import { useState } from "react";

interface TutorialStep {
  emoji: string;
  title: string;
  text: string;
  tips?: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji: "🏡",
    title: "Bem-vindo à Nossa Casinha!",
    text: "A app que organiza a vida a dois. Compras, tarefas, hábitos, despesas, refeições, eventos e mais — tudo num sítio fofo e partilhado.",
    tips: ["Toda a informação sincroniza em tempo real entre membros", "A app muda de tema ao longo do dia ☀️🌅🌙"],
  },
  {
    emoji: "📱",
    title: "Como Navegar",
    text: "Usa a barra de tabs em baixo para mudar de secção. São 10 tabs organizadas por temas.",
    tips: [
      "Swipe ← → para mudar de tab rapidamente",
      "Tap no título \"A Nossa Casinha\" para o menu rápido",
      "🔍 no canto para pesquisar em tudo",
      "⚔️ no canto para o teu perfil RPG",
    ],
  },
  {
    emoji: "🛒",
    title: "Comprinhas",
    text: "A lista de compras partilhada. Items organizam-se automaticamente por categoria (Frescos, Carnes, Padaria, etc.) seguindo o fluxo do supermercado.",
    tips: [
      "Marca como urgente para destacar no topo ⚡",
      "Atribui a quem vai comprar (tu, o/a parceiro/a, ou ambos)",
      "Preço estimado opcional para controlar gastos",
      "Categorias colapsam com barra de progresso",
    ],
  },
  {
    emoji: "🪴",
    title: "Coisinhas",
    text: "Pequenas tarefas do dia-a-dia. Auto-categorizadas em Casa, Cozinha, Decoração, Bricolage, e mais.",
    tips: [
      "Adiciona notas em cada item para detalhes",
      "Reordena por prioridade arrastando",
      "Celebração especial quando completas uma categoria inteira! 🎉",
      "Autocomplete sugere tarefas já usadas antes",
    ],
  },
  {
    emoji: "🏠",
    title: "Projetinhos",
    text: "Projetos maiores da casa — obras, pinturas, reparações. Acompanha desde a ideia até à conclusão.",
    tips: [
      "3 estados: Pendente → A Fazer → Concluído",
      "Adiciona subtarefas para dividir o trabalho",
      "Define orçamento para controlar custos",
      "Cada projeto concluído dá +5 pontos XP! 🎮",
    ],
  },
  {
    emoji: "💊",
    title: "Rotinazinhas",
    text: "Hábitos diários com sistema de streaks. Cria rotinas saudáveis e acompanha o teu progresso.",
    tips: [
      "🔥 Streak conta os dias seguidos sem falhar",
      "Configura a hora do lembrete em cada hábito",
      "Ativa notificações 🔔 para receber push mesmo com a app fechada",
      "Atribui hábitos a cada membro da casa",
    ],
  },
  {
    emoji: "💰",
    title: "Gastinhos",
    text: "Controlo de despesas simples e visual. Vê quanto gastaste por mês, categoria e pessoa.",
    tips: [
      "Barras visuais por categoria",
      "Total separado por cada membro + gastos comuns",
      "Navega entre meses com as setas ← →",
    ],
  },
  {
    emoji: "🍽️",
    title: "Receitinhas",
    text: "Planeia as refeições da semana. Pequeno-almoço, almoço, jantar e snacks para 7 dias.",
    tips: [
      "Autocomplete com refeições já usadas antes",
      "Envia ingredientes direto para as Comprinhas! 🛒",
    ],
  },
  {
    emoji: "📅",
    title: "Calendarzinho",
    text: "Vista mensal integrada com tudo o que acontece na casa. Cada tipo de atividade tem uma cor diferente.",
    tips: [
      "🟢 Hábitos  🩷 Coisinhas  🟣 Projetos",
      "🔴 Eventos  🟡 Feriados  ☀️ Meteo",
      "Feriados portugueses automáticos (fixos + Páscoa/Carnaval)",
      "Previsão meteo nos próximos 7 dias diretamente no grid",
      "Tap num dia para ver todos os detalhes",
    ],
  },
  {
    emoji: "🎉",
    title: "Eventinhos",
    text: "Organiza eventos e partilha com amigos! Cada evento pode ter lista de compras e tarefas próprias.",
    tips: [
      "Partilha eventos via link público 🔗",
      "Amigos vêem detalhes e podem juntar-se",
      "Previsão meteo automática para eventos próximos 🌤️",
      "Eventos aparecem como dots no Calendarzinho",
    ],
  },
  {
    emoji: "🌤️",
    title: "Tempinho",
    text: "Previsão meteorológica para os próximos 7 dias. Temperatura, precipitação e vento.",
    tips: [
      "Tap num dia para expandir vista horária",
      "Integrado no calendário e nos eventos",
    ],
  },
  {
    emoji: "💌",
    title: "Mensagens",
    text: "Envia notificações push com mensagens ao outro membro da casa! Mensagens rápidas ou personalizadas.",
    tips: [
      "Menu → 💌 Mensagem",
      "8 mensagens rápidas: amor, supermercado, jantar, café...",
      "Escreve mensagens personalizadas",
      "O outro membro recebe push mesmo com a app fechada",
    ],
  },
  {
    emoji: "🏆",
    title: "Perfil RPG & Gamificação",
    text: "Cada tarefa dá XP! Sobe de nível, desbloqueia equipamentos, coleciona badges e recebe loot aleatório.",
    tips: [
      "+1 XP comprinhas  +2 coisinhas  +5 projetos  +2 hábitos",
      "Loot boxes a cada 50 pontos com items cosméticos",
      "4 raridades: Comum, Raro, Épico, Lendário ✨",
      "Avatar 8-bit pixel art com 11 animais e customização total",
      "Inventário estilo WoW com drag-and-drop",
    ],
  },
  {
    emoji: "🔔",
    title: "Notificações Push",
    text: "Recebe lembretes e mensagens mesmo com a app fechada! Ativa nas Rotinazinhas.",
    tips: [
      "Vai a Rotinazinhas → tap 🔔 → aceita permissão",
      "Lembretes de hábitos na hora configurada",
      "Mensagens de outros membros da casa",
      "Funciona via Firebase Cloud Messaging",
    ],
  },
  {
    emoji: "💡",
    title: "Dicas Finais",
    text: "Estás pronto/a para organizar a tua casinha! Aqui ficam as dicas essenciais.",
    tips: [
      "Swipe entre tabs para navegar rápido ← →",
      "Menu central: tap no título \"A Nossa Casinha\"",
      "🔍 pesquisa em todas as tabs de uma vez",
      "📜 Histórico mostra tudo o que completaste",
      "⚙️ Manutenção para reorganizar categorias",
      "🔗 Convida membros para a tua casa",
      "O tema muda sozinho: ☀️ manhã → 🌤️ tarde → 🌅 anoitecer → 🌙 noite",
    ],
  },
];

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const progress = ((step + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 z-50 flex flex-col items-center justify-center animate-fade-in-up p-6">
      {/* Progress bar */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-purple-400">{step + 1} / {TUTORIAL_STEPS.length}</span>
          <button
            onClick={onClose}
            aria-label="Saltar tutorial"
            className="text-[10px] text-purple-500 hover:text-purple-300 transition-colors"
          >
            Saltar ✕
          </button>
        </div>
        <div className="h-1 bg-purple-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-purple-900/40 border border-purple-700/40 rounded-3xl p-6 text-center shadow-xl">
        <span className="text-5xl block mb-3 animate-bounce">{current.emoji}</span>
        <h3 className="text-lg font-bold text-white mb-2">{current.title}</h3>
        <p className="text-sm text-purple-200 leading-relaxed">{current.text}</p>

        {/* Tips */}
        {current.tips && current.tips.length > 0 && (
          <div className="mt-4 space-y-1.5 text-left">
            {current.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-400 text-xs mt-0.5">•</span>
                <span className="text-xs text-purple-300 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-5">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            aria-label="Passo anterior"
            className="px-5 py-2 rounded-full bg-purple-800/50 text-purple-300 text-sm font-medium hover:bg-purple-700/50 active:scale-95 transition-all"
          >
            ← Anterior
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setStep(step + 1)}
            aria-label="Próximo passo"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95 transition-all"
          >
            Seguinte →
          </button>
        ) : (
          <button
            onClick={onClose}
            aria-label="Concluir tutorial"
            className="px-6 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 active:scale-95 transition-all"
          >
            ✨ Começar!
          </button>
        )}
      </div>

      {/* Quick jump dots */}
      <div className="flex gap-1 mt-4 flex-wrap justify-center max-w-xs">
        {TUTORIAL_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`Ir para passo ${i + 1}: ${s.title}`}
            className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center transition-all ${
              i === step
                ? "bg-amber-400 text-purple-900 scale-110 font-bold"
                : i < step
                ? "bg-purple-600 text-purple-200"
                : "bg-purple-800/50 text-purple-500 hover:bg-purple-700/50"
            }`}
          >
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
