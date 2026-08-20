"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useHouseContext } from "@/lib/context";

interface ProfilePageProps {
  onClose: () => void;
  viewMember?: string;
}

type SimpleAvatar = {
  animal?: number;
};

const BASIC_ANIMALS = [
  { id: 0, name: "Panda", emoji: "🐼" },
  { id: 1, name: "Gato", emoji: "🐱" },
  { id: 2, name: "Coelho", emoji: "🐰" },
  { id: 3, name: "Raposa", emoji: "🦊" },
  { id: 4, name: "Urso", emoji: "🐻" },
  { id: 5, name: "Cão", emoji: "🐶" },
  { id: 6, name: "Pinguim", emoji: "🐧" },
  { id: 7, name: "Hamster", emoji: "🐹" },
  { id: 8, name: "Coala", emoji: "🐨" },
  { id: 9, name: "Coruja", emoji: "🦉" },
  { id: 10, name: "Sapo", emoji: "🐸" },
] as const;

export default function ProfilePage({ onClose, viewMember }: ProfilePageProps) {
  const { user } = useAuth();
  const { houseId } = useHouseContext();
  const owner = viewMember || user?.displayName || user?.email || "user";
  const isReadOnly = Boolean(viewMember);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(viewMember || user?.displayName || "");
  const [avatar, setAvatar] = useState<SimpleAvatar>({ animal: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const snap = await getDoc(doc(db, "gamification", owner));
      if (!cancelled && snap.exists()) {
        const stored = snap.data().avatar as SimpleAvatar | undefined;
        if (stored) setAvatar({ animal: stored.animal ?? 0 });
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [owner]);

  const animal = useMemo(
    () => BASIC_ANIMALS.find((item) => item.id === (avatar.animal ?? 0)) ?? BASIC_ANIMALS[0],
    [avatar.animal],
  );

  const saveAvatar = async (animalId: number) => {
    if (isReadOnly) return;
    setSaving(true);
    try {
      const nextAvatar = {
        animal: animalId,
        eyes: 0,
        mouth: 0,
        top: 0,
        bottom: 0,
        accessory: 0,
        background: 0,
        effect: 0,
      };
      await setDoc(doc(db, "gamification", owner), { avatar: nextAvatar }, { merge: true });
      setAvatar({ animal: animalId });

      if (houseId && user) {
        const houseRef = doc(db, "houses", houseId);
        const houseSnap = await getDoc(houseRef);
        if (houseSnap.exists()) {
          const members = houseSnap.data().members || [];
          const updated = members.map((member: { uid: string; avatar?: string }) =>
            member.uid === user.uid ? { ...member, avatar: BASIC_ANIMALS.find((item) => item.id === animalId)?.emoji || "🐼" } : member,
          );
          await updateDoc(houseRef, { members: updated });
        }
      }
      setStatus("Animal atualizado");
    } catch (error) {
      setStatus(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!user || isReadOnly || !displayName.trim()) return;
    const nextName = displayName.trim();
    const oldName = user.displayName || user.email || "user";
    setSaving(true);
    try {
      await updateProfile(user, { displayName: nextName });
      await updateDoc(doc(db, "users", user.uid), { name: nextName });

      if (houseId) {
        const houseRef = doc(db, "houses", houseId);
        const houseSnap = await getDoc(houseRef);
        if (houseSnap.exists()) {
          const members = houseSnap.data().members || [];
          const updated = members.map((member: { uid: string; name: string }) =>
            member.uid === user.uid ? { ...member, name: nextName } : member,
          );
          await updateDoc(houseRef, { members: updated });
        }
      }

      if (oldName !== nextName) {
        const oldRef = doc(db, "gamification", oldName);
        const oldSnap = await getDoc(oldRef);
        if (oldSnap.exists()) {
          await setDoc(doc(db, "gamification", nextName), oldSnap.data(), { merge: true });
          await deleteDoc(oldRef);
        }
      }
      setStatus("Perfil atualizado");
    } catch (error) {
      setStatus(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto animate-fade-in-up"
      style={{ background: "linear-gradient(to bottom right, #fdf2f8, #fff1f2, #faf5ff)" }}
    >
      <div className="mx-auto w-full max-w-lg px-5 py-6">
        <div className="relative text-center">
          <button
            onClick={onClose}
            aria-label="Fechar perfil"
            className="absolute right-0 top-0 text-rose-400 hover:text-rose-600"
          >
            ✕
          </button>
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-pink-200/70 bg-white/80 text-6xl">
            {loading ? "…" : animal.emoji}
          </div>
          <h2 className="mt-3 text-xl font-bold text-rose-800">{viewMember || displayName || owner}</h2>
          {!isReadOnly && user?.email && <p className="mt-1 text-xs text-pink-400">{user.email}</p>}
        </div>

        {!isReadOnly && (
          <div className="mt-6 space-y-4">
            <section className="rounded-2xl border border-pink-100/70 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-rose-700">Perfil</h3>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Nome"
                className="mt-3 w-full rounded-xl border border-pink-200/60 bg-white/80 px-4 py-3 text-sm text-rose-800 outline-none focus:border-rose-300"
              />
              <button
                onClick={saveProfile}
                disabled={saving || !displayName.trim()}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Guardar perfil
              </button>
            </section>

            <section className="rounded-2xl border border-pink-100/70 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-rose-700">Escolhe o teu animal</h3>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {BASIC_ANIMALS.map((option) => {
                  const selected = option.id === avatar.animal;
                  return (
                    <button
                      key={option.id}
                      onClick={() => saveAvatar(option.id)}
                      disabled={saving}
                      aria-label={`Escolher ${option.name}`}
                      className={`rounded-full border p-2 text-center transition-transform active:scale-95 ${
                        selected ? "border-rose-400 bg-pink-100" : "border-pink-200/60 bg-white/80"
                      }`}
                    >
                      <span className="block text-2xl">{option.emoji}</span>
                      <span className="mt-1 block truncate text-[9px] text-rose-600">{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {status && <p className="text-center text-xs text-rose-500">{status}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
