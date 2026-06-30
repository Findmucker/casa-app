"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, birthDate: string) => Promise<void>;
  onGoogle: () => Promise<void>;
}

export default function AuthScreen({ onLogin, onRegister, onGoogle }: AuthScreenProps) {
  const { locale, setLocale } = useT();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        if (!name.trim()) { setError("Nome é obrigatório"); setLoading(false); return; }
        if (!birthDate) { setError("Data de nascimento é obrigatória"); setLoading(false); return; }
        await onRegister(name.trim(), email, password, birthDate);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) setError("Email ou password errados");
      else if (msg.includes("user-not-found")) setError("Conta não encontrada");
      else if (msg.includes("email-already-in-use")) setError("Email já registado");
      else if (msg.includes("weak-password")) setError("Password muito fraca (mín. 6 chars)");
      else if (msg.includes("invalid-email")) setError("Email inválido");
      else setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex gap-1">
        <button
          onClick={() => setLocale("pt")}
          className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${locale === "pt" ? "bg-rose-400 text-white" : "bg-white/60 text-rose-400"}`}
        >🇵🇹 PT</button>
        <button
          onClick={() => setLocale("en")}
          className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${locale === "en" ? "bg-rose-400 text-white" : "bg-white/60 text-rose-400"}`}
        >🇬🇧 EN</button>
      </div>
      <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-in-up">
        {/* Logo */}
        <div className="animate-float">
          <div className="text-7xl drop-shadow-sm">🏡</div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-rose-400">A Nossa Casinha</h1>
          <p className="text-rose-300 text-sm mt-1">
            {mode === "login" ? "Bem-vindo de volta!" : "Criar nova conta"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-pink-100/50 rounded-2xl p-1 w-full">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === "login" ? "bg-white text-rose-600 shadow-sm" : "text-pink-400"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === "register" ? "bg-white text-rose-600 shadow-sm" : "text-pink-400"
            }`}
          >
            Registar
          </button>
        </div>

        {/* Form */}
        <div className="w-full space-y-3">
          {mode === "register" && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="O teu nome..."
                className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50"
              />
              <div className="relative">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50"
                />
                {!birthDate && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-pink-300 pointer-events-none">
                    🎂 Data de nascimento
                  </span>
                )}
              </div>
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email..."
            className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Password..."
            className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50"
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 py-3 text-white font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm shadow-pink-200/50"
        >
          {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-pink-200/40" />
          <span className="text-[11px] text-pink-300">ou</span>
          <div className="flex-1 h-px bg-pink-200/40" />
        </div>

        <button
          onClick={async () => {
            setError("");
            setLoading(true);
            try {
              await onGoogle();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Erro desconhecido";
              if (msg.includes("unauthorized-domain")) setError("Domínio não autorizado no Firebase Authentication");
              else if (msg.includes("operation-not-allowed")) setError("Login Google não está ativo no Firebase");
              else setError(msg);
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full rounded-2xl border border-pink-200/60 bg-white/80 py-3 text-sm font-medium text-rose-600 hover:bg-pink-50 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <span className="text-lg">G</span>
          Continuar com Google
        </button>
      </div>
    </div>
  );
}
