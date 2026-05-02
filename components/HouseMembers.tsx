"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHouseContext } from "@/lib/context";
import { getLevel, getTitle } from "@/lib/gamification";
import { AnimeAnimalCharacter, type AvatarConfig } from "./AvatarBuilder";

interface HouseMembersProps {
  onClose: () => void;
}

interface MemberData {
  uid: string;
  name: string;
  role: string;
  avatar?: AvatarConfig;
  points: number;
  level: number;
  title: string;
  maxStreak: number;
}

export default function HouseMembers({ onClose }: HouseMembersProps) {
  const { members } = useHouseContext();
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data: MemberData[] = await Promise.all(
        members.map(async (m) => {
          try {
            const ref = doc(db, "gamification", m.name);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const d = snap.data();
              const points = d.points || 0;
              const { level } = getLevel(points);
              return {
                uid: m.uid,
                name: m.name,
                role: m.role,
                avatar: d.avatar || undefined,
                points,
                level,
                title: getTitle(level),
                maxStreak: d.maxStreak || 0,
              };
            }
          } catch {}
          return {
            uid: m.uid,
            name: m.name,
            role: m.role,
            points: 0,
            level: 1,
            title: getTitle(1),
            maxStreak: 0,
          };
        })
      );
      setMemberData(data);
      setLoading(false);
    };
    load();
  }, [members]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 z-50 overflow-y-auto animate-fade-in-up">
      {/* Header */}
      <div className="relative pt-6 pb-4 text-center border-b border-pink-100/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 text-sm transition-colors"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold text-rose-600">🏠 A Nossa Casinha</h2>
        <p className="text-xs text-purple-500 mt-0.5">{members.length} membro{members.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Members list */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-2xl">👥</div>
          </div>
        ) : (
          memberData.map((m, i) => (
            <div
              key={m.uid}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-pink-100/50 shadow-sm animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {m.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-rose-200/50 bg-white flex items-center justify-center">
                    <AnimeAnimalCharacter config={m.avatar} size={40} />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center border-2 border-rose-200/50">
                    <span className="text-white font-bold text-lg">{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-rose-700 truncate">{m.name}</p>
                  {m.role === "admin" && (
                    <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">admin</span>
                  )}
                </div>
                <p className="text-[11px] text-purple-500">{m.title}</p>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-bold text-purple-600">Nv. {m.level}</p>
                <p className="text-[10px] text-gray-500">{m.points} pts</p>
                {m.maxStreak > 0 && (
                  <p className="text-[10px] text-orange-500 font-medium">🔥 {m.maxStreak}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
