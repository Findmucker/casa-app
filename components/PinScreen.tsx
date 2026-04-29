"use client";

import { useState } from "react";

interface PinScreenProps {
  onVerify: (pin: string) => Promise<boolean>;
}

export default function PinScreen({ onVerify }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="flex flex-col items-center gap-8 p-8 animate-fade-in-up">
        {/* Cute floating house */}
        <div className="animate-float">
          <div className="text-7xl drop-shadow-sm">🏡</div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-rose-400">
            A Nossa Casinha
          </h1>
          <p className="text-rose-300 text-sm mt-1">bem-vindos de volta!</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-14 w-14 rounded-3xl border-2 flex items-center justify-center text-2xl transition-all duration-300 ${
                pin.length > i
                  ? "border-pink-400 bg-pink-100 scale-110 shadow-md shadow-pink-100"
                  : "border-pink-200 bg-white/80"
              } ${error ? "border-red-300 animate-shake" : ""}`}
            >
              {pin[i] ? (
                <span className="text-pink-400">&#10084;</span>
              ) : (
                ""
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm font-medium">
            Hmm, PIN errado...
          </p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 stagger-children">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "back"].map((num, i) => (
            <button
              key={i}
              disabled={loading || num === null}
              className={`h-16 w-16 rounded-3xl text-xl font-semibold transition-all duration-200 active:scale-90 animate-fade-in-up ${
                num === null
                  ? "invisible"
                  : num === "back"
                  ? "bg-pink-100/80 text-pink-400 hover:bg-pink-200/80 text-lg"
                  : "bg-white/80 text-rose-500 shadow-sm shadow-pink-100/50 border border-pink-100/60 hover:bg-pink-50 hover:shadow-md hover:shadow-pink-100/50"
              }`}
              onClick={() => {
                if (num === "back") {
                  setPin((p) => p.slice(0, -1));
                  setError(false);
                } else if (typeof num === "number" && pin.length < 4) {
                  const newPin = pin + num;
                  setPin(newPin);
                  if (newPin.length === 4) {
                    setTimeout(() => {
                      setLoading(true);
                      onVerify(newPin).then((ok) => {
                        if (!ok) {
                          setError(true);
                          setPin("");
                        }
                        setLoading(false);
                      });
                    }, 300);
                  }
                }
              }}
            >
              {num === "back" ? "&#8592;" : num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
