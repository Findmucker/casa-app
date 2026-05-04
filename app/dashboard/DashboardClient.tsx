"use client";

import { useState, useRef, useCallback, useEffect, useContext, useMemo } from "react";
import ShoppingList from "@/components/ShoppingList";
import PriorityList from "@/components/PriorityList";
import ProjectList from "@/components/ProjectList";
import EventList from "@/components/EventList";
import Weather from "@/components/Weather";
import HabitList from "@/components/HabitList";
import ExpenseList from "@/components/ExpenseList";
import Calendar from "@/components/Calendar";
import DashboardSummary from "@/components/DashboardSummary";
import MaintenancePanel from "@/components/MaintenancePanel";
import ProfilePage from "@/components/ProfilePage";
import SearchOverlay from "@/components/SearchOverlay";
import HistoryPanel from "@/components/HistoryPanel";
import InvitePanel from "@/components/InvitePanel";
import FriendsPanel from "@/components/FriendsPanel";
import MiniAvatar from "@/components/MiniAvatar";
import HouseMembers from "@/components/HouseMembers";
import SendMessagePanel from "@/components/SendMessagePanel";
import HelpPanel from "@/components/HelpPanel";
import UndoToast from "@/components/UndoToast";
import { UndoProvider } from "@/lib/useUndoStack";
import { HouseIdContext, useCollection, CollectionDataContext, type ShoppingItem, type SmallPriorityItem, type BigPriorityItem, type HabitItem, type HabitCheck, type ExpenseItem } from "@/lib/hooks";
import { useAuth, updateHouseName } from "@/lib/auth";
import { useTimeTheme } from "@/lib/themes";
import { registerPushToken } from "@/lib/notifications";
import { LocaleProvider, useT } from "@/lib/i18n";
import { useHouseContext } from "@/lib/context";
import { getLevel, getTitle } from "@/lib/gamification";
import { type AvatarConfig } from "@/components/AvatarBuilder";
import { type EquippedItems } from "@/lib/gamification";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TAB_IDS = ["home", "shopping", "small", "big", "habits", "expenses", "calendar", "events", "weather"] as const;

interface MemberWidget { uid: string; name: string; avatar?: AvatarConfig; level: number; title: string; points: number; equipped?: EquippedItems; }
const TAB_EMOJIS = ["✨", "🛒", "🧹", "🔧", "🧘", "💰", "📅", "🎉", "🌤️"];
const TAB_LABEL_KEYS = [
  "tabs.home", "tabs.shopping", "tabs.small", "tabs.big", "tabs.habits",
  "tabs.expenses", "tabs.calendar", "tabs.events", "tabs.weather",
] as const;

type TabId = (typeof TAB_IDS)[number];

export default function Dashboard() {
  return (
    <LocaleProvider>
      <DashboardInner />
    </LocaleProvider>
  );
}

function DashboardInner() {
  const { t, locale, setLocale } = useT();
  const ALL_TABS = TAB_IDS.map((id, i) => ({ id, label: t(TAB_LABEL_KEYS[i]), emoji: TAB_EMOJIS[i] }));
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [menuSubPanel, setMenuSubPanel] = useState<"house" | "settings" | null>(null);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [profileViewMember, setProfileViewMember] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showHouseMembers, setShowHouseMembers] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [editingHouseName, setEditingHouseName] = useState(false);
  const [houseNameInput, setHouseNameInput] = useState("");
  const [houseMembersMessageTo, setHouseMembersMessageTo] = useState<string | undefined>(undefined);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [memberActionTarget, setMemberActionTarget] = useState<MemberWidget | null>(null);
  const theme = useTimeTheme();
  const darkMode = theme.isDark;
  const { user, logout } = useAuth();
  const houseId = useContext(HouseIdContext);
  const { members, userName, houseName } = useHouseContext();

  // ─── Back button navigation ───────────────────────────────────
  const openOverlay = useCallback((open: () => void) => {
    history.pushState({ overlay: true }, "");
    open();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (showGamification) { setShowGamification(false); setProfileViewMember(undefined); }
      else if (showSearch) { setShowSearch(false); }
      else if (showMaintenance) { setShowMaintenance(false); }
      else if (showHistory) { setShowHistory(false); }
      else if (showInvite) { setShowInvite(false); }
      else if (showHouseMembers) { setShowHouseMembers(false); setHouseMembersMessageTo(undefined); }
      else if (showFriends) { setShowFriends(false); }
      else if (showSendMessage) { setShowSendMessage(false); }
      else if (showHelp) { setShowHelp(false); }
      else if (showPanel) { setShowPanel(false); setMenuSubPanel(null); }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showGamification, showSearch, showMaintenance, showHistory, showInvite, showHouseMembers, showFriends, showSendMessage, showHelp, showPanel]);

  // Members widget data
  const [memberWidgets, setMemberWidgets] = useState<MemberWidget[]>([]);
  useEffect(() => {
    const load = async () => {
      const data: MemberWidget[] = await Promise.all(
        members.map(async (m) => {
          try {
            const snap = await getDoc(doc(db, "gamification", m.name));
            if (snap.exists()) {
              const d = snap.data();
              const pts = d.points || 0;
              const { level } = getLevel(pts);
              return { uid: m.uid, name: m.name, avatar: d.avatar || undefined, level, title: getTitle(level), points: pts, equipped: d.equipped || undefined };
            }
          } catch { /* ignore */ }
          return { uid: m.uid, name: m.name, level: 1, title: getTitle(1), points: 0 };
        })
      );
      setMemberWidgets(data);
    };
    if (members.length > 0) load();
  }, [members]);

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


  // Auto-register push token if permission already granted
  useEffect(() => {
    if (user?.displayName && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      registerPushToken(user.displayName.toLowerCase());
    }
  }, [user?.displayName]);

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
    const currentIdx = TAB_IDS.indexOf(activeTab);
    const nextIdx = TAB_IDS.indexOf(id);
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

    const currentIdx = TAB_IDS.indexOf(activeTab);
    if (dx < 0 && currentIdx < TAB_IDS.length - 1) {
      switchTab(TAB_IDS[currentIdx + 1]);
    } else if (dx > 0 && currentIdx > 0) {
      switchTab(TAB_IDS[currentIdx - 1]);
    }
  };

  const getSlideClass = () => {
    if (!slideDir) return "";
    return slideDir === "left" ? "animate-slide-left" : "animate-slide-right";
  };

  return (
    <div className={`flex flex-col h-screen transition-all duration-1000 ${theme.cssClass} bg-gradient-to-br ${theme.bgGradient}`}>
      {/* Header */}
      <header className={`backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between transition-colors duration-500 ${
        darkMode
          ? "bg-white/40 border-purple-200/30"
          : "bg-white/50 border-pink-100/40"
      }`}>
        <button
          onClick={() => openOverlay(() => setShowSearch(true))}
          aria-label="Pesquisar"
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
            darkMode ? "bg-purple-100/60 text-purple-500 hover:bg-purple-100" : "bg-pink-50 text-pink-400 hover:bg-pink-100"
          }`}
        >
          🔍
        </button>
        <button
          onClick={() => { if (showPanel) { history.back(); } else { openOverlay(() => { setShowPanel(true); setMenuSubPanel(null); }); } }}
          aria-label="Menu principal"
          aria-expanded={showPanel}
          className={`text-lg font-bold tracking-wide active:scale-95 transition-all ${
            darkMode ? "text-purple-500 hover:text-purple-600" : "text-rose-400 hover:text-rose-500"
          }`}
        >
          🏡 {houseName}
        </button>
        <button
          onClick={() => openOverlay(() => setShowGamification(true))}
          aria-label="Perfil e gamificação"
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all"
        >
          <MiniAvatar name={userName} size={32} />
        </button>
      </header>

      {/* Content */}
      <UndoProvider>
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
          {activeTab === "calendar" && <Calendar />}
          {activeTab === "events" && <EventList />}
          {activeTab === "weather" && <Weather />}
        </div>

        {/* Grid panel overlay */}
        {showPanel && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) history.back(); }}
            className={`absolute inset-0 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in-up bg-gradient-to-br ${
            darkMode
              ? "from-purple-100/98 via-indigo-100/98 to-pink-100/98"
              : theme.phase === "morning"
                ? "from-amber-50/98 via-yellow-50/98 to-orange-50/98"
                : theme.phase === "dusk"
                  ? "from-orange-50/98 via-rose-100/98 to-purple-100/98"
                  : "from-rose-50/98 via-pink-50/98 to-fuchsia-50/98"
          }`}>
            {/* Sub-panel for categories */}
            {menuSubPanel ? (
              <div className="animate-fade-in-up flex flex-col items-center">
                <button
                  onClick={() => setMenuSubPanel(null)}
                  className={`mb-4 text-xs font-medium px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                    darkMode ? "bg-purple-100 text-purple-600" : "bg-pink-100 text-rose-500"
                  }`}
                >
                  ← {t("common.close")}
                </button>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-purple-500" : "text-rose-300"}`}>
                  {menuSubPanel === "house" ? t("menu.house") : t("menu.settings")}
                </p>
                <div className="grid grid-cols-2 gap-3 px-6 max-w-sm">
                  {(menuSubPanel === "house" ? [
                    { emoji: "🔗", label: t("menu.invite"), action: () => { setShowPanel(false); setMenuSubPanel(null); setShowInvite(true); } },
                    { emoji: "👥", label: t("menu.members"), action: () => { setShowPanel(false); setMenuSubPanel(null); setShowHouseMembers(true); } },
                    { emoji: "🏠", label: t("menu.friends"), action: () => { setShowPanel(false); setMenuSubPanel(null); setShowFriends(true); } },
                    { emoji: "✏️", label: t("house.rename"), action: () => { setHouseNameInput(houseName); setEditingHouseName(true); } },
                  ] : [
                    { emoji: "📜", label: t("menu.history"), action: () => { setShowPanel(false); setMenuSubPanel(null); setShowHistory(true); } },
                    { emoji: "⚙️", label: t("menu.maintenance"), action: () => { setShowPanel(false); setMenuSubPanel(null); setShowMaintenance(true); } },
                    { emoji: "❓", label: t("menu.help"), action: () => { setShowPanel(false); setMenuSubPanel(null); setShowHelp(true); } },
                  ]).map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl transition-all active:scale-90 ${
                        darkMode
                          ? "bg-purple-100/60 border border-purple-200/50 hover:bg-purple-100"
                          : "bg-white/60 border border-pink-100/30 hover:bg-white/80"
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className={`text-[10px] font-medium ${darkMode ? "text-purple-600" : "text-rose-600"}`}>{item.label}</span>
                    </button>
                  ))}
                  {menuSubPanel === "house" && editingHouseName && (
                    <div className={`col-span-full flex gap-2 p-3 rounded-2xl ${
                      darkMode ? "bg-purple-100/60 border border-purple-200/30" : "bg-white/60 border border-pink-100/30"
                    }`}>
                      <input
                        type="text"
                        value={houseNameInput}
                        onChange={(e) => setHouseNameInput(e.target.value)}
                        maxLength={30}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-pink-200/60 text-sm focus:outline-none focus:border-rose-300"
                        placeholder={t("house.namePlaceholder")}
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          if (houseId && houseNameInput.trim()) {
                            await updateHouseName(houseId, houseNameInput);
                            setEditingHouseName(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-xs font-semibold active:scale-95 transition-all"
                      >
                        ✓
                      </button>
                    </div>
                  )}
                  {menuSubPanel === "settings" && (
                    <div className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl ${
                      darkMode ? "bg-purple-100/60 border border-purple-200/30" : "bg-white/60 border border-pink-100/30"
                    }`}>
                      <span className="text-2xl">🌐</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setLocale("pt")}
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all active:scale-90 ${
                            locale === "pt"
                              ? darkMode ? "bg-purple-600 text-white" : "bg-rose-400 text-white"
                              : darkMode ? "text-purple-400" : "text-pink-400"
                          }`}
                        >PT</button>
                        <button
                          onClick={() => setLocale("en")}
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all active:scale-90 ${
                            locale === "en"
                              ? darkMode ? "bg-purple-600 text-white" : "bg-rose-400 text-white"
                              : darkMode ? "text-purple-400" : "text-pink-400"
                          }`}
                        >EN</button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Logout in settings sub-panel */}
                {menuSubPanel === "settings" && (
                  <div className="mt-5">
                    <button
                      onClick={() => { logout(); }}
                      aria-label="Sair da conta"
                      className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl transition-all active:scale-90 ${
                        darkMode
                          ? "bg-red-100/60 border border-red-200/40 hover:bg-red-100"
                          : "bg-red-50/60 border border-red-200/50 hover:bg-red-100/80"
                      }`}
                    >
                      <span className="text-xl">🚪</span>
                      <span className={`text-[10px] font-medium ${darkMode ? "text-red-500" : "text-red-500"}`}>{t("menu.logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Members widget — premium card */}
                {memberWidgets.length > 0 && (
                  <div className={`w-full px-4 max-w-sm mb-6 relative`}>
                    <div className={`rounded-[28px] p-5 shadow-lg ${
                      darkMode
                        ? "bg-gradient-to-br from-purple-100/70 via-purple-50/50 to-indigo-100/60 border border-purple-200/50 shadow-purple-200/20"
                        : "bg-gradient-to-br from-white/90 via-rose-50/70 to-pink-50/80 border border-pink-200/40 shadow-pink-100/30"
                    }`}>
                      {/* Title as elegant button */}
                      <button
                        onClick={() => { setShowPanel(false); setMenuSubPanel(null); setShowHouseMembers(true); }}
                        className={`w-full flex items-center justify-center gap-2 mb-4 py-2 rounded-2xl transition-all active:scale-[0.97] ${
                          darkMode
                            ? "bg-purple-200/30 hover:bg-purple-200/50"
                            : "bg-white/60 hover:bg-white/80 shadow-sm shadow-pink-100/20"
                        }`}
                      >
                        <span className="text-base">👥</span>
                        <span className={`text-xs font-bold tracking-wide ${darkMode ? "text-purple-600" : "text-rose-500"}`}>
                          {t("menu.members")}
                        </span>
                        <span className={`text-[10px] ${darkMode ? "text-purple-400" : "text-pink-300"}`}>›</span>
                      </button>

                      {/* Member avatars — larger, more spacious */}
                      <div className="flex gap-3 justify-center flex-wrap">
                        {memberWidgets.map((m, i) => (
                          <button
                            key={m.uid}
                            onClick={() => setMemberActionTarget(memberActionTarget?.uid === m.uid ? null : m)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-300 active:scale-90 min-w-[70px] animate-fade-in-up ${
                              memberActionTarget?.uid === m.uid
                                ? darkMode
                                  ? "bg-purple-200/80 border border-purple-300/70 shadow-lg shadow-purple-200/30 scale-105"
                                  : "bg-white border border-pink-200/70 shadow-lg shadow-pink-100/40 scale-105"
                                : darkMode
                                  ? "hover:bg-purple-200/30 hover:scale-[1.03]"
                                  : "hover:bg-white/60 hover:scale-[1.03]"
                            }`}
                            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                          >
                            <div className={`relative transition-transform duration-300 ${memberActionTarget?.uid === m.uid ? "animate-bounce-gentle" : ""}`}>
                              <MiniAvatar name={m.name} size={48} avatarConfig={m.avatar || null} equippedItems={m.equipped} />
                            </div>
                            <span className={`text-[10px] font-semibold leading-tight ${darkMode ? "text-purple-700" : "text-rose-700"}`}>{m.name}</span>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-300 ${
                              memberActionTarget?.uid === m.uid
                                ? darkMode ? "bg-purple-300/60 scale-110" : "bg-pink-200/80 scale-110"
                                : darkMode ? "bg-purple-200/50" : "bg-pink-100/60"
                            }`}>
                              <span className={`text-[8px] font-bold ${darkMode ? "text-purple-600" : "text-pink-500"}`}>Nv.{m.level}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Action popup for selected member */}
                      {memberActionTarget && (
                        <div className={`mt-4 pt-3 flex gap-2.5 justify-center animate-fade-in-up border-t ${
                          darkMode ? "border-purple-200/30" : "border-pink-100/40"
                        }`}>
                          {memberActionTarget.uid !== user?.uid && (
                            <button
                              onClick={() => { setHouseMembersMessageTo(memberActionTarget.name); setShowPanel(false); setMenuSubPanel(null); setMemberActionTarget(null); setShowHouseMembers(true); }}
                              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-semibold transition-all active:scale-90 shadow-sm ${
                                darkMode
                                  ? "bg-purple-200/70 text-purple-700 hover:bg-purple-200 shadow-purple-200/20"
                                  : "bg-white text-rose-600 border border-pink-100/50 hover:shadow-md shadow-pink-100/20"
                              }`}
                            >
                              <span>💌</span> {t("menu.message")}
                            </button>
                          )}
                          <button
                            onClick={() => { const name = memberActionTarget.uid !== user?.uid ? memberActionTarget.name : undefined; setProfileViewMember(name); setShowPanel(false); setMenuSubPanel(null); setMemberActionTarget(null); setShowGamification(true); }}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-semibold transition-all active:scale-90 shadow-sm ${
                              darkMode
                                ? "bg-purple-200/70 text-purple-700 hover:bg-purple-200 shadow-purple-200/20"
                                : "bg-white text-rose-600 border border-pink-100/50 hover:shadow-md shadow-pink-100/20"
                            }`}
                          >
                            <span>👤</span> {t("menu.profile")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* All tabs grid */}
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-purple-500" : "text-rose-300"}`}>{t("menu.navigate")}</p>
                <div className="grid grid-cols-5 gap-2.5 px-4 max-w-sm mb-6">
                  {ALL_TABS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => { switchTab(section.id); setShowPanel(false); }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all active:scale-90 ${
                        activeTab === section.id
                          ? darkMode
                            ? "bg-purple-200/70 shadow-md shadow-purple-200/30 border border-purple-300/60 scale-105"
                            : "bg-white shadow-md shadow-pink-100/50 border border-pink-200/60 scale-105"
                          : darkMode
                            ? "bg-purple-100/60 border border-purple-200/50 hover:bg-purple-100"
                            : "bg-white/60 border border-pink-100/30 hover:bg-white/80"
                      }`}
                    >
                      <span className="text-lg">{section.emoji}</span>
                      <span className={`text-[9px] font-medium leading-tight ${darkMode ? "text-purple-600" : "text-rose-600"}`}>{section.label}</span>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className={`w-32 h-px mb-5 ${darkMode ? "bg-purple-200/50" : "bg-pink-200/60"}`} />

                {/* Category buttons */}
                <div className="grid grid-cols-2 gap-3 px-6 max-w-sm">
                  {[
                    { key: "house" as const, emoji: "🏠", label: t("menu.house") },
                    { key: "settings" as const, emoji: "⚙️", label: t("menu.settings") },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setMenuSubPanel(cat.key)}
                      className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl transition-all active:scale-90 ${
                        darkMode
                          ? "bg-purple-100/60 border border-purple-200/50 hover:bg-purple-200/60"
                          : "bg-white/60 border border-pink-100/30 hover:bg-white/80"
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className={`text-[10px] font-medium ${darkMode ? "text-purple-600" : "text-rose-600"}`}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overlays */}
        {showMaintenance && <MaintenancePanel onClose={() => history.back()} />}
        {showGamification && <ProfilePage onClose={() => history.back()} viewMember={profileViewMember} />}
        {showSearch && <SearchOverlay onClose={() => history.back()} onNavigate={(tab) => switchTab(tab as TabId)} />}
        {showHistory && <HistoryPanel onClose={() => history.back()} />}
        {showInvite && houseId && user && <InvitePanel houseId={houseId} userId={user.uid} onClose={() => history.back()} />}
        {showHouseMembers && <HouseMembers onClose={() => history.back()} initialMessageTo={houseMembersMessageTo} />}
        {showFriends && <FriendsPanel onClose={() => history.back()} />}
        {showSendMessage && <SendMessagePanel onClose={() => history.back()} />}
        {showHelp && <HelpPanel onClose={() => history.back()} />}
        <UndoToast />
      </main>
      </CollectionDataContext.Provider>
      </UndoProvider>

      {/* Bottom tabs - scrollable */}
      <nav aria-label="Navegação principal" className={`backdrop-blur-xl border-t safe-area-bottom transition-colors duration-500 ${
        darkMode ? "bg-white/40 border-purple-200/30" : "bg-white/60 border-pink-100/40"
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
                  ? darkMode ? "text-purple-500 scale-105" : "text-rose-500 scale-105"
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
                <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full ${
                  darkMode ? "bg-gradient-to-r from-purple-400 to-pink-400" : "bg-gradient-to-r from-pink-400 to-rose-400"
                }`} />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
