"use client";

import { useState, useCallback, useEffect } from "react";
import { usePin } from "@/lib/hooks";
import PinScreen from "@/components/PinScreen";
import OwnerPicker from "@/components/OwnerPicker";
import Greeting from "@/components/Greeting";
import Dashboard from "./dashboard/page";

export default function Home() {
  const { authenticated, loading, verify } = usePin();
  const [showGreeting, setShowGreeting] = useState(true);
  const [owner, setOwner] = useState<"eduardo" | "moniquinha" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("casa-owner");
    if (saved === "eduardo" || saved === "moniquinha") {
      setOwner(saved);
    }
  }, []);

  const handleOwnerSelect = (selected: "eduardo" | "moniquinha") => {
    localStorage.setItem("casa-owner", selected);
    setOwner(selected);
  };

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

  if (!owner) {
    return <OwnerPicker onSelect={handleOwnerSelect} />;
  }

  return (
    <>
      {showGreeting && <Greeting onDone={handleGreetingDone} />}
      <Dashboard />
    </>
  );
}
