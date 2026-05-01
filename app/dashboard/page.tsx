"use client";

import { useState, useRef, useCallback, useEffect, useContext } from "react";
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
import { HouseIdContext } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const houseId = useContext(HouseIdContext);

  // Load dark mode preference + auto sunrise/sunset + tutorial
  useEffect(() => {
    const saved = localStorage.getItem("casa-dark-mode");
    if (saved === "true") setDarkMode(true);
    else if (saved !== "false") {
      fetchSunTimes();
    }
    // Show tutorial on first visit
    if (!localStorage.getItem("casa-tutorial-done")) {
      setShowTutorial(true);
      localStorage.setItem("casa-tutorial-done", "true");
    }
  }, []);

  const fetchSunTimes = async () => {
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=39.36&longitude=-9.16&daily=sunrise,sunset&timezone=Europe/Lisbon&forecast_days=1"
      );
      const data = await res.json();
      const sunrise = data.daily?.sunrise?.[0];
      const sunset = data.daily?.sunset?.[0];
      if (sunrise && sunset) {
        const now = new Date();
        const sunriseTime = new Date(sunrise);
        const sunsetTime = new Date(sunset);
        setDarkMode(now < sunriseTime || now > sunsetTime);
      }
    } catch {
      // Fallback: dark between 20:00-07:00
      const hour = new Date().getHours();
      setDarkMode(hour >= 20 || hour < 7);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("casa-dark-mode", String(next));
      return next;
    });
  };

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
    <div className={`flex flex-col h-screen transition-colors duration-500 ${
      darkMode
        ? "dark-mode bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        : "bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50"
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-md border-b px-4 py-3 flex items-center justify-between transition-colors duration-500 ${
        darkMode
          ? "bg-slate-900/60 border-purple-800/30"
          : "bg-white/60 border-pink-100/50"
      }`}>
        <button
          onClick={() => setShowSearch(true)}
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
            darkMode ? "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50" : "bg-pink-50 text-pink-400 hover:bg-pink-100"
          }`}
        >
          🔍
        </button>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={`text-lg font-bold tracking-wide active:scale-95 transition-all ${
            darkMode ? "text-purple-300 hover:text-purple-200" : "text-rose-400 hover:text-rose-500"
          }`}
        >
          🏡 A Nossa Casinha
        </button>
        <button
          onClick={() => setShowGamification(true)}
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
            darkMode ? "bg-purple-900/40 text-purple-300 hover:bg-purple-800/40" : "bg-purple-50 text-purple-500 hover:bg-purple-100"
          }`}
        >
          ⚔️
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
          <div className={`absolute inset-0 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in-up ${
            darkMode
              ? "bg-gradient-to-br from-slate-900/98 via-purple-950/98 to-slate-900/98"
              : "bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98"
          }`}>
            <p className={`text-sm font-semibold mb-4 ${darkMode ? "text-purple-300" : "text-rose-400"}`}>Ir para...</p>
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
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => { setShowPanel(false); setShowHistory(true); }}
                className={`text-xs transition-colors ${darkMode ? "text-purple-400 hover:text-purple-200" : "text-pink-400 hover:text-pink-600"}`}
              >
                📜 Histórico
              </button>
              <button
                onClick={() => { setShowPanel(false); setShowInvite(true); }}
                className={`text-xs transition-colors ${darkMode ? "text-purple-400 hover:text-purple-200" : "text-pink-400 hover:text-pink-600"}`}
              >
                🔗 Convidar
              </button>
              <button
                onClick={() => { toggleDarkMode(); }}
                className={`text-xs transition-colors ${darkMode ? "text-purple-400 hover:text-purple-200" : "text-pink-400 hover:text-pink-600"}`}
              >
                {darkMode ? "☀️ Claro" : "🌙 Escuro"}
              </button>
              <button
                onClick={() => { setShowPanel(false); setShowMaintenance(true); }}
                className={`text-xs transition-colors ${darkMode ? "text-purple-400 hover:text-purple-200" : "text-pink-400 hover:text-pink-600"}`}
              >
                ⚙️ Manutenção
              </button>
              <button
                onClick={() => { setShowPanel(false); setShowTutorial(true); }}
                className={`text-xs transition-colors ${darkMode ? "text-purple-400 hover:text-purple-200" : "text-pink-400 hover:text-pink-600"}`}
              >
                ❓ Tutorial
              </button>
            </div>
            <button
              onClick={() => { logout(); }}
              className={`mt-3 text-xs transition-colors ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-300 hover:text-red-500"}`}
            >
              🚪 Sair
            </button>
            <button
              onClick={() => setShowPanel(false)}
              className={`mt-4 text-sm transition-colors ${darkMode ? "text-purple-400 hover:text-purple-200" : "text-pink-400 hover:text-pink-600"}`}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Overlays */}
        {showMaintenance && <MaintenancePanel onClose={() => setShowMaintenance(false)} />}
        {showGamification && <ProfilePage onClose={() => setShowGamification(false)} />}
        {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} onNavigate={(tab) => switchTab(tab as TabId)} />}
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
        {showInvite && houseId && user && <InvitePanel houseId={houseId} userId={user.uid} onClose={() => setShowInvite(false)} />}
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      </main>

      {/* Bottom tabs - scrollable */}
      <nav className={`backdrop-blur-md border-t safe-area-bottom transition-colors duration-500 ${
        darkMode ? "bg-slate-900/70 border-purple-800/30" : "bg-white/70 border-pink-100/50"
      }`}>
        <div ref={navRef} className="flex overflow-x-auto scrollbar-hide">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
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
