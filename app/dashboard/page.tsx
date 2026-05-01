"use client";

import { useState, useRef, useCallback } from "react";
import ShoppingList from "@/components/ShoppingList";
import PriorityList from "@/components/PriorityList";
import ProjectList from "@/components/ProjectList";
import EventList from "@/components/EventList";
import Weather from "@/components/Weather";
import HabitList from "@/components/HabitList";
import ExpenseList from "@/components/ExpenseList";
import MealPlanner from "@/components/MealPlanner";
import Calendar from "@/components/Calendar";
import DashboardSummary from "@/components/DashboardSummary";
import MaintenancePanel from "@/components/MaintenancePanel";
import Gamification from "@/components/Gamification";
import SearchOverlay from "@/components/SearchOverlay";
import HistoryPanel from "@/components/HistoryPanel";

const ALL_TABS = [
  { id: "home", label: "Início", emoji: "✨" },
  { id: "shopping", label: "Comprinhas", emoji: "🛒" },
  { id: "small", label: "Coisinhas", emoji: "🪴" },
  { id: "big", label: "Projetinhos", emoji: "🏠" },
  { id: "habits", label: "Rotinazinhas", emoji: "💊" },
  { id: "expenses", label: "Gastinhos", emoji: "💰" },
  { id: "meals", label: "Receitinhas", emoji: "🍽️" },
  { id: "calendar", label: "Calendarzinho", emoji: "📅" },
  { id: "events", label: "Eventinhos", emoji: "🎉" },
  { id: "weather", label: "Tempinho", emoji: "🌤️" },
] as const;

type TabId = (typeof ALL_TABS)[number]["id"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Swipe detection
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const switchTab = useCallback((id: TabId) => {
    if (id === activeTab && !showPanel) return;
    const currentIdx = ALL_TABS.findIndex((t) => t.id === activeTab);
    const nextIdx = ALL_TABS.findIndex((t) => t.id === id);
    setSlideDir(nextIdx > currentIdx ? "left" : "right");
    setActiveTab(id);
    setShowPanel(false);
    setTimeout(() => setSlideDir(null), 300);
  }, [activeTab, showPanel]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    // Only swipe if horizontal movement > 80px and > vertical
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy)) return;

    const currentIdx = ALL_TABS.findIndex((t) => t.id === activeTab);
    if (dx < 0 && currentIdx < ALL_TABS.length - 1) {
      switchTab(ALL_TABS[currentIdx + 1].id);
    } else if (dx > 0 && currentIdx > 0) {
      switchTab(ALL_TABS[currentIdx - 1].id);
    }
  };

  const getSlideClass = () => {
    if (!slideDir) return "";
    return slideDir === "left" ? "animate-slide-left" : "animate-slide-right";
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-pink-100/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowSearch(true)}
          className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center text-pink-400 hover:bg-pink-100 active:scale-90 transition-all"
        >
          🔍
        </button>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="text-lg font-bold text-rose-400 tracking-wide hover:text-rose-500 active:scale-95 transition-all"
        >
          🏡 A Nossa Casinha
        </button>
        <button
          onClick={() => setShowGamification(true)}
          className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 active:scale-90 transition-all"
        >
          🏆
        </button>
      </header>

      {/* Content */}
      <main
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`h-full ${getSlideClass()}`}>
          {activeTab === "home" && <DashboardSummary onNavigate={(tab) => switchTab(tab as TabId)} />}
          {activeTab === "shopping" && <ShoppingList />}
          {activeTab === "small" && <PriorityList />}
          {activeTab === "big" && <ProjectList />}
          {activeTab === "habits" && <HabitList />}
          {activeTab === "expenses" && <ExpenseList />}
          {activeTab === "meals" && <MealPlanner />}
          {activeTab === "calendar" && <Calendar />}
          {activeTab === "events" && <EventList />}
          {activeTab === "weather" && <Weather />}
        </div>

        {/* Grid panel overlay */}
        {showPanel && (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in-up">
            <p className="text-sm font-semibold text-rose-400 mb-4">Ir para...</p>
            <div className="grid grid-cols-3 gap-3 px-6 max-w-sm">
              {ALL_TABS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => switchTab(section.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${
                    activeTab === section.id
                      ? "bg-white shadow-md shadow-pink-100/50 border border-pink-200/60 scale-105"
                      : "bg-white/60 border border-pink-100/30 hover:bg-white/80"
                  }`}
                >
                  <span className="text-xl">{section.emoji}</span>
                  <span className="text-[10px] font-medium text-rose-600">{section.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => { setShowPanel(false); setShowHistory(true); }}
                className="text-xs text-pink-400 hover:text-pink-600 transition-colors"
              >
                📜 Histórico
              </button>
              <button
                onClick={() => { setShowPanel(false); setShowMaintenance(true); }}
                className="text-xs text-pink-400 hover:text-pink-600 transition-colors"
              >
                ⚙️ Manutenção
              </button>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="mt-4 text-sm text-pink-400 hover:text-pink-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Overlays */}
        {showMaintenance && <MaintenancePanel onClose={() => setShowMaintenance(false)} />}
        {showGamification && <Gamification onClose={() => setShowGamification(false)} />}
        {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} onNavigate={(tab) => switchTab(tab as TabId)} />}
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </main>

      {/* Bottom tabs - scrollable */}
      <nav className="bg-white/70 backdrop-blur-md border-t border-pink-100/50 safe-area-bottom">
        <div className="flex overflow-x-auto scrollbar-hide">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex-shrink-0 min-w-[56px] flex flex-col items-center gap-0.5 py-2.5 px-1.5 transition-all duration-300 relative ${
                activeTab === tab.id && !showPanel
                  ? "text-rose-500 scale-105"
                  : "text-gray-400 hover:text-rose-300"
              }`}
            >
              <span className={`text-lg transition-all duration-300 ${
                activeTab === tab.id && !showPanel ? "scale-110" : ""
              }`}>
                {tab.emoji}
              </span>
              <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
              {activeTab === tab.id && !showPanel && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
