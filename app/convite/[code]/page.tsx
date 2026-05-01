"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, joinHouse } from "@/lib/auth";
import AuthScreen from "@/components/AuthScreen";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user, loading: authLoading, login, register, loginWithGoogle } = useAuth();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "joining" | "done">("loading");
  const [houseName, setHouseName] = useState("");

  // Validate invite
  useEffect(() => {
    const check = async () => {
      try {
        const inviteSnap = await getDoc(doc(db, "invites", code));
        if (!inviteSnap.exists()) { setStatus("invalid"); return; }
        const data = inviteSnap.data();
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) { setStatus("invalid"); return; }
        // Get house name
        const houseSnap = await getDoc(doc(db, "houses", data.houseId));
        if (houseSnap.exists()) setHouseName(houseSnap.data().name);
        setStatus("valid");
      } catch {
        setStatus("invalid");
      }
    };
    check();
  }, [code]);

  // Auto-join when user is logged in
  useEffect(() => {
    if (!user || status !== "valid") return;
    const doJoin = async () => {
      setStatus("joining");
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userName = userSnap.exists() ? userSnap.data().name : user.displayName || "User";
      const ok = await joinHouse(user.uid, userName, code);
      if (ok) {
        setStatus("done");
        setTimeout(() => router.push("/"), 1500);
      } else {
        setStatus("invalid");
      }
    };
    doJoin();
  }, [user, status, code, router]);

  if (authLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="text-5xl animate-float">🏡</div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4">
        <div className="text-center animate-fade-in-up">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-rose-500">Convite inválido</h1>
          <p className="text-sm text-pink-400 mt-2">Este código expirou ou não existe.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-6 py-2.5 text-white font-medium text-sm active:scale-95 transition-all"
          >
            Ir para a app
          </button>
        </div>
      </div>
    );
  }

  if (status === "done" || status === "joining") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4">
        <div className="text-center animate-fade-in-up">
          <div className="text-5xl mb-4 animate-celebrate">🎉</div>
          <h1 className="text-xl font-bold text-rose-500">
            {status === "joining" ? "A juntar-te..." : "Bem-vindo!"}
          </h1>
          {houseName && <p className="text-sm text-pink-400 mt-2">Juntaste-te a &ldquo;{houseName}&rdquo;</p>}
        </div>
      </div>
    );
  }

  // Valid invite but not logged in → show auth
  if (!user) {
    return (
      <div>
        <div className="bg-pink-100/60 px-4 py-3 text-center">
          <p className="text-sm text-rose-600">
            🔗 Convite para <strong>{houseName || "uma casa"}</strong>
          </p>
          <p className="text-[11px] text-pink-400">Cria conta ou faz login para aceitar</p>
        </div>
        <AuthScreen
          onLogin={async (email, pw) => { await login(email, pw); }}
          onRegister={async (name, email, pw) => { await register(name, email, pw); }}
          onGoogle={async () => { await loginWithGoogle(); }}
        />
      </div>
    );
  }

  return null;
}
