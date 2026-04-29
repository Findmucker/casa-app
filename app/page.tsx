"use client";

import { useState, useCallback } from "react";
import { usePin } from "@/lib/hooks";
import PinScreen from "@/components/PinScreen";
import Greeting from "@/components/Greeting";
import Dashboard from "./dashboard/page";

export default function Home() {
  const { authenticated, loading, verify } = usePin();
  const [showGreeting, setShowGreeting] = useState(true);

  const handleGreetingDone = useCallback(() => {
    setShowGreeting(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="text-5xl animate-float">🏡</div>
      </div>
    );
  }

  if (!authenticated) {
    return <PinScreen onVerify={verify} />;
  }

  return (
    <>
      {showGreeting && <Greeting onDone={handleGreetingDone} />}
      <Dashboard />
    </>
  );
}
