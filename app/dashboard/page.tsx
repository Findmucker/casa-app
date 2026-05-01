"use client";

import { useState, useRef } from "react";
import ShoppingList from "@/components/ShoppingList";
import PriorityList from "@/components/PriorityList";
import ProjectList from "@/components/ProjectList";
import EventList from "@/components/EventList";
import Weather from "@/components/Weather";
import MaintenancePanel from "@/components/MaintenancePanel";

const ALL_TABS = [
  { id: "shopping", label: "Comprinhas", emoji: "🛒" },
  { id: "small", label: "Coisinhas", emoji: "🪴" },
  { id: "big", label: "Projetinhos", emoji: "🏠" },
  { id: "events", label: "Eventinhos", emoji: "🎉" },
  { id: "weather", label: "Tempinho", emoji: "🌤️" },
] as const;

type TabId = (typeof ALL_TABS)[number]["id"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("shopping");
  const [animating, setAnimating] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const prevTab = useRef<TabId>(activeTab);

  const switchTab = (id: TabId) => {
    if (id === activeTab && !showPanel) return;
    prevTab.current = activeTab;
    setAnimating(true);
    setActiveTab(id);
    setShowPanel(false);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-pink-100/50 px-4 py-3.5 flex items-center justify-center animate-fade-in-up">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="text-lg font-bold text-rose-400 tracking-wide hover:text-rose-500 active:scale-95 transition-all"
        >
          🏡 A Nossa Casinha
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full transition-all duration-300 ${animating ? "opacity-0 translate-x-3" : "opacity-100 translate-x-0"}`}>
          {activeTab === "shopping" && <ShoppingList />}
          {activeTab === "small" && <PriorityList />}
          {activeTab === "big" && <ProjectList />}
          {activeTab === "events" && <EventList />}
          {activeTab === "weather" && <Weather />}
        </div>

        {/* Grid panel overlay */}
        {showPanel && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in-up"
          >
            <p className="text-sm font-semibold text-rose-400 mb-6">Ir para...</p>
            <div className="grid grid-cols-3 gap-4 px-8">
              {ALL_TABS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => switchTab(section.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all active:scale-90 ${
                    activeTab === section.id
                      ? "bg-white shadow-md shadow-pink-100/50 border border-pink-200/60 scale-105"
                      : "bg-white/60 border border-pink-100/30 hover:bg-white/80 hover:shadow-sm"
                  }`}
                >
                  <span className="text-2xl">{section.emoji}</span>
                  <span className="text-[11px] font-medium text-rose-600">
                    {section.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="mt-8 text-sm text-pink-400 hover:text-pink-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setShowPanel(false); setShowMaintenance(true); }}
              className="mt-4 text-xs text-pink-300 hover:text-pink-500 transition-colors"
            >
              ⚙️ Manutenção
            </button>
          </div>
        )}

        {/* Maintenance panel */}
        {showMaintenance && (
          <MaintenancePanel onClose={() => setShowMaintenance(false)} />
        )}
      </main>

      {/* Bottom tabs - scrollable */}
      <nav className="bg-white/70 backdrop-blur-md border-t border-pink-100/50 safe-area-bottom">
        <div className="flex overflow-x-auto scrollbar-hide">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex-shrink-0 flex-1 min-w-[64px] flex flex-col items-center gap-1 py-3 transition-all duration-300 relative ${
                activeTab === tab.id && !showPanel
                  ? "text-rose-500 scale-105"
                  : "text-gray-400 hover:text-rose-300"
              }`}
            >
              <span className={`text-xl transition-all duration-300 ${
                activeTab === tab.id && !showPanel ? "scale-110" : ""
              }`}>
                {tab.emoji}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && !showPanel && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-8 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
