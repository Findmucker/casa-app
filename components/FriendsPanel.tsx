"use client";

import { useState, useCallback } from "react";
import { useHouseContext } from "@/lib/context";
import { useT } from "@/lib/i18n";
import {
  useFriends,
  usePendingRequests,
  getFriendCode,
  connectByCode,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchHouses,
} from "@/lib/friends";
import MiniAvatar from "@/components/MiniAvatar";

interface FriendsPanelProps {
  onClose: () => void;
}

export default function FriendsPanel({ onClose }: FriendsPanelProps) {
  const { t } = useT();
  const { houseId, houseName } = useHouseContext();
  const { friends, loading } = useFriends(houseId);
  const { requests } = usePendingRequests(houseId);

  const [view, setView] = useState<"list" | "add">("list");
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; members: string[] }[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const handleGetCode = async () => {
    const code = await getFriendCode(houseId);
    setFriendCode(code);
  };

  const handleConnectByCode = async () => {
    if (!codeInput.trim()) return;
    setLoadingAction(true);
    const result = await connectByCode(houseId, houseName, codeInput.trim());
    if (result.success) {
      setMessage({ text: t("friends.connected"), type: "success" });
      setCodeInput("");
    } else {
      const errorMap: Record<string, string> = {
        invalid_code: t("friends.errorInvalidCode"),
        own_house: t("friends.errorOwnHouse"),
        already_friends: t("friends.errorAlreadyFriends"),
      };
      setMessage({ text: errorMap[result.error || ""] || "Error", type: "error" });
    }
    setLoadingAction(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim() || searchInput.length < 2) return;
    setSearching(true);
    const results = await searchHouses(searchInput, houseId);
    setSearchResults(results);
    setSearching(false);
  }, [searchInput, houseId]);

  const handleSendRequest = async (toId: string, toName: string) => {
    await sendFriendRequest(houseId, houseName, toId, toName);
    setMessage({ text: t("friends.requestSent"), type: "success" });
    setSearchResults([]);
    setSearchInput("");
    setTimeout(() => setMessage(null), 3000);

    // Notify target house members
    try {
      const { doc: firestoreDoc, getDoc: fsGetDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const houseSnap = await fsGetDoc(firestoreDoc(db, "houses", toId));
      if (houseSnap.exists()) {
        const targetMembers: { name: string }[] = houseSnap.data().members || [];
        for (const m of targetMembers) {
          fetch("/api/send-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: m.name.toLowerCase(),
              title: `🏠 Pedido de amizade`,
              body: `A casa "${houseName}" quer ser vossa vizinha!`,
              tag: "friend-request",
            }),
          }).catch(() => {});
        }
      }
    } catch { /* best effort */ }
  };

  const handleAccept = async (req: { id: string; fromHouseId: string; fromHouseName: string; toHouseId: string; toHouseName: string }) => {
    await acceptFriendRequest(req.id, req.fromHouseId, req.fromHouseName, req.toHouseId, req.toHouseName);

    // Notify the requesting house that their request was accepted
    try {
      const { doc: firestoreDoc, getDoc: fsGetDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const houseSnap = await fsGetDoc(firestoreDoc(db, "houses", req.fromHouseId));
      if (houseSnap.exists()) {
        const fromMembers: { name: string }[] = houseSnap.data().members || [];
        for (const m of fromMembers) {
          fetch("/api/send-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: m.name.toLowerCase(),
              title: `🎉 Pedido aceite!`,
              body: `A casa "${houseName}" aceitou o vosso pedido de amizade!`,
              tag: "friend-accepted",
            }),
          }).catch(() => {});
        }
      }
    } catch { /* best effort */ }
  };

  const handleReject = async (requestId: string) => {
    await rejectFriendRequest(requestId);
  };

  const handleRemove = async (friendHouseId: string) => {
    await removeFriend(houseId, friendHouseId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in-up bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/60 backdrop-blur-sm border-b border-pink-100/40">
        <h2 className="text-lg font-bold text-rose-500">{t("friends.title")}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              view === "list" ? "bg-rose-400 text-white" : "bg-pink-100 text-pink-500"
            }`}
          >
            {t("friends.title")}
          </button>
          <button
            onClick={() => setView("add")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              view === "add" ? "bg-rose-400 text-white" : "bg-pink-100 text-pink-500"
            }`}
          >
            + {t("friends.add")}
          </button>
          <button
            onClick={onClose}
            className="text-sm text-pink-400 hover:text-pink-600 transition-all active:scale-95"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Message toast */}
      {message && (
        <div className={`mx-5 mt-3 p-3 rounded-2xl text-sm font-medium text-center animate-fade-in-up ${
          message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}>
          {message.text}
        </div>
      )}

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="mx-5 mt-4">
          <h3 className="text-sm font-bold text-purple-600 mb-2">{t("friends.pending")} ({requests.length})</h3>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-white/70 rounded-2xl border border-pink-100/40">
                <span className="text-sm font-medium text-rose-700">🏠 {req.fromHouseName}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req)}
                    className="px-3 py-1 rounded-full bg-green-400 text-white text-xs font-medium active:scale-95 transition-all"
                  >
                    {t("friends.accept")}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-3 py-1 rounded-full bg-pink-200 text-pink-600 text-xs font-medium active:scale-95 transition-all"
                  >
                    {t("friends.reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5">
        {view === "list" && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-pink-400 py-10">...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🏠</div>
                <p className="text-pink-400 text-sm">{t("friends.empty")}</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 bg-white/70 rounded-[28px] border border-pink-100/40 backdrop-blur-sm shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏠</span>
                      <p className="text-sm font-bold text-rose-700">{friend.houseName}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(friend.id)}
                      className="text-xs text-pink-400 active:scale-95 transition-all"
                    >
                      {t("friends.remove")}
                    </button>
                  </div>
                  {/* Member avatars */}
                  {friend.members && friend.members.length > 0 && (
                    <div className="flex gap-3 justify-center flex-wrap">
                      {friend.members.map((m, i) => (
                        <div
                          key={m.name}
                          className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-pink-50/60 transition-all animate-fade-in-up"
                          style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                        >
                          <MiniAvatar name={m.name} size={42} />
                          <span className="text-[10px] font-semibold text-rose-700 leading-tight">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!friend.members || friend.members.length === 0) && (
                    <p className="text-xs text-pink-300 text-center">{t("friends.noMembers")}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {view === "add" && (
          <div className="space-y-6">
            {/* Your friend code */}
            <div className="bg-white/70 rounded-2xl p-4 border border-pink-100/40">
              <h3 className="text-sm font-bold text-rose-600 mb-2">{t("friends.code")}</h3>
              {friendCode ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold tracking-[0.3em] text-purple-600">{friendCode}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(friendCode);
                      setMessage({ text: t("friends.copied"), type: "success" });
                      setTimeout(() => setMessage(null), 2000);
                    }}
                    className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-600 active:scale-95"
                  >
                    📋
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGetCode}
                  className="w-full rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-6 py-2.5 text-white text-sm font-semibold active:scale-[0.98] transition-all"
                >
                  {t("friends.generateCode")}
                </button>
              )}
            </div>

            {/* Enter code */}
            <div className="bg-white/70 rounded-2xl p-4 border border-pink-100/40">
              <h3 className="text-sm font-bold text-rose-600 mb-2">{t("friends.enterCode")}</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="flex-1 px-4 py-2 rounded-xl border border-pink-200/60 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-rose-300"
                />
                <button
                  onClick={handleConnectByCode}
                  disabled={loadingAction || codeInput.length < 6}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  ✓
                </button>
              </div>
            </div>

            {/* Search by name */}
            <div className="bg-white/70 rounded-2xl p-4 border border-pink-100/40">
              <h3 className="text-sm font-bold text-rose-600 mb-2">{t("friends.search")}</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t("friends.search")}
                  className="flex-1 px-4 py-2 rounded-xl border border-pink-200/60 text-sm focus:outline-none focus:border-rose-300"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || searchInput.length < 2}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  🔍
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((house) => (
                    <div key={house.id} className="p-4 bg-pink-50/60 rounded-[28px] border border-pink-100/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏠</span>
                          <p className="text-sm font-bold text-rose-700">{house.name}</p>
                        </div>
                        <button
                          onClick={() => handleSendRequest(house.id, house.name)}
                          className="px-3 py-1.5 rounded-full bg-rose-400 text-white text-xs font-medium active:scale-95 transition-all"
                        >
                          + {t("friends.add")}
                        </button>
                      </div>
                      {house.members.length > 0 && (
                        <div className="flex gap-3 justify-center flex-wrap">
                          {house.members.map((name, i) => (
                            <div
                              key={name}
                              className="flex flex-col items-center gap-1 p-2 rounded-2xl animate-fade-in-up"
                              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                            >
                              <MiniAvatar name={name} size={42} />
                              <span className="text-[10px] font-semibold text-rose-700 leading-tight">{name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && searchInput.length >= 2 && !searching && (
                <p className="text-xs text-pink-400 text-center">{t("friends.noResults")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
