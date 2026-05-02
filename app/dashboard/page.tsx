"use client";

import { useState, useRef, useCallback, useEffect, useContext, useMemo } from "react";
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
import ProfilePage from "@/components/ProfilePage";
import Tutorial from "@/components/Tutorial";
import SearchOverlay from "@/components/SearchOverlay";
import HistoryPanel from "@/components/HistoryPanel";
import InvitePanel from "@/components/InvitePanel";
import HouseMembers from "@/components/HouseMembers";
import { HouseIdContext, useCollection, CollectionDataContext, type ShoppingItem, type SmallPriorityItem, type BigPriorityItem, type HabitItem, type HabitCheck, type ExpenseItem } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { useTimeTheme } from "@/lib/themes";

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
  const [showInvite, setShowInvite] = useState(false);
  const [showHouseMembers, setShowHouseMembers] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const theme = useTimeTheme();
  const darkMode = theme.isDark;
  const { user, logout } = useAuth();
  const houseId = useContext(HouseIdContext);

  // Shared collection data — single set of listeners for Dashboard + DashboardSummary
  const { items: shopping } = useCollection<ShoppingItem>("shopping", "createdAt");
  const { items: coisinhas } = useCollection<SmallPriorityItem>("priorities_small", "order");
  const { items: projects } = useCollection<BigPriorityItem>("priorities_big", "order");
  const { items: habits } = useCollection<HabitItem>("habits", "createdAt");
  const { items: checks } = useCollection<HabitCheck>("habit_checks", "createdAt");
  const { items: expenses } = useCollection<ExpenseItem>("expenses", "createdAt");

  const sharedData = useMemo(() => ({
    shopping, coisinhas, projects, habits, checks, expenses,
  }), [shopping, coisinhas, projects, habits, checks, expenses]);

  // Tutorial on first visit
  useEffect(() => {
    if (!localStorage.getItem("casa-tutorial-done")) {
      setShowTutorial(true);
      localStorage.setItem("casa-tutorial-done", "true");
    }
  }, []);

  // Swipe detection
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeTab]);

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

    // Don't swipe tabs if touch originated inside a horizontally scrollable element
    const target = e.target as HTMLElement;
    const scrollParent = target.closest(".overflow-x-auto, .scrollbar-hide");
    if (scrollParent && (scrollParent as HTMLElement).scrollWidth > (scrollParent as HTMLElement).clientWidth) return;

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
    <div className={`flex flex-col h-screen transition-all duration-1000 ${theme.cssClass} bg-gradient-to-br ${theme.bgGradient}`}>
      {/* Header */}
      <header className={`backdrop-blur-md border-b px-4 py-3 flex items-center justify-between transition-colors duration-500 ${
        darkMode
          ? "bg-slate-900/60 border-purple-800/30"
          : "bg-white/60 border-pink-100/50"
      }`}>
        <button
          onClick={() => setShowSearch(true)}
          aria-label="Pesquisar"
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
            darkMode ? "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50" : "bg-pink-50 text-pink-400 hover:bg-pink-100"
          }`}
        >
          🔍
        </button>
        <button
          onClick={() => setShowPanel(!showPanel)}
          aria-label="Menu principal"
          aria-expanded={showPanel}
          className={`text-lg font-bold tracking-wide active:scale-95 transition-all ${
            darkMode ? "text-purple-300 hover:text-purple-200" : "text-rose-400 hover:text-rose-500"
          }`}
        >
          🏡 A Nossa Casinha
        </button>
        <button
          onClick={() => setShowGamification(true)}
          aria-label="Perfil e gamificação"
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
            darkMode ? "bg-purple-900/40 text-purple-300 hover:bg-purple-800/40" : "bg-purple-50 text-purple-500 hover:bg-purple-100"
          }`}
        >
          ⚔️
        </button>
      </header>

      {/* Content */}
      <CollectionDataContext.Provider value={sharedData}>
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
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setShowPanel(false); }}
            className={`absolute inset-0 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in-up bg-gradient-to-br ${
            darkMode
              ? "from-[#363258]/98 via-[#453d6e]/98 to-[#363258]/98"
              : theme.phase === "morning"
                ? "from-amber-50/98 via-yellow-50/98 to-orange-50/98"
                : theme.phase === "dusk"
                  ? "from-orange-100/98 via-rose-200/98 to-purple-200/98"
                  : "from-pink-50/98 via-rose-50/98 to-purple-50/98"
          }`}>
            {/* Navigation section */}
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-purple-400" : "text-rose-300"}`}>Navegar</p>
            <div className="grid grid-cols-3 gap-3 px-6 max-w-sm">
              {ALL_TABS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => switchTab(section.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${
                    activeTab === section.id
                      ? darkMode
                        ? "bg-purple-800/60 shadow-md shadow-purple-900/50 border border-purple-600/60 scale-105"
                        : "bg-white shadow-md shadow-pink-100/50 border border-pink-200/60 scale-105"
                      : darkMode
                        ? "bg-slate-800/60 border border-purple-800/30 hover:bg-purple-900/40"
                        : "bg-white/60 border border-pink-100/30 hover:bg-white/80"
                  }`}
                >
                  <span className="text-xl">{section.emoji}</span>
                  <span className={`text-[10px] font-medium ${darkMode ? "text-purple-200" : "text-rose-600"}`}>{section.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className={`w-32 h-px my-6 ${darkMode ? "bg-purple-700/50" : "bg-pink-200/60"}`} />

            {/* Options section */}
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-purple-400" : "text-rose-300"}`}>Gestão</p>
            <div className="grid grid-cols-3 gap-3 px-6 max-w-sm">
              {[
                { emoji: "📜", label: "Histórico", action: () => { setShowPanel(false); setShowHistory(true); } },
                { emoji: "🔗", label: "Convidar", action: () => { setShowPanel(false); setShowInvite(true); } },
                { emoji: "👥", label: "Membros", action: () => { setShowPanel(false); setShowHouseMembers(true); } },
                { emoji: "⚙️", label: "Manutenção", action: () => { setShowPanel(false); setShowMaintenance(true); } },
                { emoji: "❓", label: "Tutorial", action: () => { setShowPanel(false); setShowTutorial(true); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${
                    darkMode
                      ? "bg-slate-800/60 border border-purple-800/30 hover:bg-purple-900/40"
                      : "bg-white/60 border border-pink-100/30 hover:bg-white/80"
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className={`text-[10px] font-medium ${darkMode ? "text-purple-200" : "text-rose-600"}`}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Sair — isolated */}
            <div className="mt-5">
              <button
                onClick={() => { logout(); }}
                aria-label="Sair da conta"
                className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl transition-all active:scale-90 ${
                  darkMode
                    ? "bg-red-950/40 border border-red-800/40 hover:bg-red-900/50"
                    : "bg-red-50/60 border border-red-200/50 hover:bg-red-100/80"
                }`}
              >
                <span className="text-xl">🚪</span>
                <span className={`text-[10px] font-medium ${darkMode ? "text-red-400" : "text-red-500"}`}>Sair</span>
              </button>
            </div>
          </div>
        )}

        {/* Overlays */}
        {showMaintenance && <MaintenancePanel onClose={() => setShowMaintenance(false)} />}
        {showGamification && <ProfilePage onClose={() => setShowGamification(false)} />}
        {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} onNavigate={(tab) => switchTab(tab as TabId)} />}
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
        {showInvite && houseId && user && <InvitePanel houseId={houseId} userId={user.uid} onClose={() => setShowInvite(false)} />}
        {showHouseMembers && <HouseMembers onClose={() => setShowHouseMembers(false)} />}
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      </main>
      </CollectionDataContext.Provider>

      {/* Bottom tabs - scrollable */}
      <nav aria-label="Navegação principal" className={`backdrop-blur-md border-t safe-area-bottom transition-colors duration-500 ${
        darkMode ? "bg-slate-900/70 border-purple-800/30" : "bg-white/70 border-pink-100/50"
      }`}>
        <div ref={navRef} className="flex overflow-x-auto scrollbar-hide" role="tablist">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id && !showPanel}
              aria-label={tab.label}
              onClick={() => switchTab(tab.id)}
              className={`flex-shrink-0 min-w-[56px] flex flex-col items-center gap-0.5 py-2.5 px-1.5 transition-all duration-300 relative ${
                activeTab === tab.id && !showPanel
                  ? darkMode ? "text-purple-300 scale-105" : "text-rose-500 scale-105"
                  : darkMode ? "text-gray-500 hover:text-purple-400" : "text-gray-400 hover:text-rose-300"
              }`}
            >
              <span className={`text-lg transition-all duration-300 ${
                activeTab === tab.id && !showPanel ? "scale-110" : ""
              }`}>
                {tab.emoji}
              </span>
              <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
              {activeTab === tab.id && !showPanel && (
                <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full ${
                  darkMode ? "bg-gradient-to-r from-purple-400 to-pink-400" : "bg-gradient-to-r from-pink-300 to-rose-300"
                }`} />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
