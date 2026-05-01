"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth, useHouse, createHouse, joinHouse } from "@/lib/auth";
import { HouseIdContext } from "@/lib/hooks";
import AuthScreen from "@/components/AuthScreen";
import HouseSetup from "@/components/HouseSetup";
import Greeting from "@/components/Greeting";
import Dashboard from "./dashboard/page";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const { user, loading: authLoading, login, register, loginWithGoogle, logout } = useAuth();
  const { houseId, house, loading: houseLoading } = useHouse(user?.uid || null);
  const [showGreeting, setShowGreeting] = useState(true);
  const [userName, setUserName] = useState("");

  // Load user name
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserName(snap.data().name || user.displayName || "");
    };
    load();
  }, [user]);

  const handleGreetingDone = useCallback(() => {
    setShowGreeting(false);
  }, []);

  // Loading
  if (authLoading || (user && houseLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="text-5xl animate-float">🏡</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <AuthScreen
        onLogin={async (email, pw) => { await login(email, pw); }}
        onRegister={async (name, email, pw) => { await register(name, email, pw); setUserName(name); }}
        onGoogle={async () => { await loginWithGoogle(); }}
      />
    );
  }

  // No house yet
  if (!houseId) {
    return (
      <HouseSetup
        userName={userName || user.displayName || "Amigo"}
        onCreateHouse={async (name) => {
          await createHouse(user.uid, userName || user.displayName || "User", name);
          window.location.reload();
        }}
        onJoinHouse={async (code) => {
          const ok = await joinHouse(user.uid, userName || user.displayName || "User", code);
          if (ok) window.location.reload();
          return ok;
        }}
      />
    );
  }

  // Authenticated + has house
  return (
    <HouseIdContext.Provider value={houseId}>
      {showGreeting && <Greeting onDone={handleGreetingDone} />}
      <Dashboard />
    </HouseIdContext.Provider>
  );
}
