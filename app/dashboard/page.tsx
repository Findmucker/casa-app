"use client";

import { useState, useEffect, useRef } from "react";
import ShoppingList from "@/components/ShoppingList";
import PriorityList from "@/components/PriorityList";
import ProjectList from "@/components/ProjectList";
import AlarmList from "@/components/AlarmList";
import Weather from "@/components/Weather";
import { requestNotificationPermission, registerPushToken } from "@/lib/notifications";

const TABS = [
  { id: "shopping", label: "Compras", emoji: "🧺" },
  { id: "small", label: "Coisinhas", emoji: "🪴" },
  { id: "big", label: "Projetos", emoji: "🏡" },
  { id: "alarms", label: "Alarmes", emoji: "⏰" },
  { id: "weather", label: "Tempo", emoji: "🌤️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("shopping");
  const [animating, setAnimating] = useState(false);
  const prevTab = useRef<TabId>(activeTab);

  useEffect(() => {
    requestNotificationPermission();
    // Register push token - uses device name from localStorage
    const owner = localStorage.getItem("casa-owner") as "eduardo" | "moniquinha" | null;
    if (owner) {
      registerPushToken(owner);
    }
  }, []);

  const switchTab = (id: TabId) => {
    if (id === activeTab) return;
    prevTab.current = activeTab;
    setAnimating(true);
    setActiveTab(id);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-pink-100/50 px-4 py-3.5 flex items-center justify-center animate-fade-in-up">
        <h1 className="text-lg font-bold text-rose-400 tracking-wide">
          🏡 A Nossa Casinha
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <div className={`h-full transition-all duration-300 ${animating ? "opacity-0 translate-x-3" : "opacity-100 translate-x-0"}`}>
          {activeTab === "shopping" && <ShoppingList />}
          {activeTab === "small" && (
            <PriorityList collectionName="priorities_small" type="small" />
          )}
          {activeTab === "big" && <ProjectList />}
          {activeTab === "alarms" && <AlarmList />}
          {activeTab === "weather" && <Weather />}
        </div>
      </main>

      {/* Bottom tabs - cozy style */}
      <nav className="bg-white/70 backdrop-blur-md border-t border-pink-100/50 safe-area-bottom">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-300 relative ${
                activeTab === tab.id
                  ? "text-rose-500 scale-105"
                  : "text-gray-400 hover:text-rose-300"
              }`}
            >
              <span className={`text-xl transition-all duration-300 ${
                activeTab === tab.id ? "scale-110" : ""
              }`}>
                {tab.emoji}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-8 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
