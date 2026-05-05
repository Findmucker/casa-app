"use client";

import { useState, useMemo } from "react";
import TabTip from "@/components/TabTip";
import { useCollection, type ExpenseItem, type IncomeItem, type SavingsGoal } from "@/lib/hooks";
import { useMemberNames } from "@/lib/context";
import MiniAvatar from "./MiniAvatar";
import ExpenseCharts from "./ExpenseCharts";
import { useT } from "@/lib/i18n";

const EXPENSE_CATEGORIES = [
  { id: "casa", emoji: "🏠", label: "Casa" },
  { id: "compras", emoji: "🛒", label: "Compras" },
  { id: "restaurantes", emoji: "🍽️", label: "Restaurantes" },
  { id: "transporte", emoji: "🚗", label: "Transporte" },
  { id: "lazer", emoji: "🎉", label: "Lazer" },
  { id: "saude", emoji: "🏥", label: "Saúde" },
  { id: "outros", emoji: "📦", label: "Outros" },
];

const SAVINGS_EMOJIS = ["🎯", "✈️", "🚗", "🏠", "💍", "🎓", "💻", "🎮", "👶", "🐾"];

type SubTab = "expenses" | "income" | "savings";

export default function ExpenseList() {
  const { t } = useT();
  const memberNames = useMemberNames();
  const { items: expenses, loading: loadingExpenses, add: addExpense, remove: removeExpense } = useCollection<ExpenseItem>("expenses", "createdAt");
  const { items: incomes, loading: loadingIncome, add: addIncome, remove: removeIncome } = useCollection<IncomeItem>("income", "createdAt");
  const { items: savingsGoals, loading: loadingSavings, add: addSavings, update: updateSavings, remove: removeSavings } = useCollection<SavingsGoal>("savings_goals", "createdAt");

  const [subTab, setSubTab] = useState<SubTab>("expenses");
  const [showAdd, setShowAdd] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Expense form
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("compras");
  const [newPayer, setNewPayer] = useState("ambos");

  // Income form
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newIncomeOwner, setNewIncomeOwner] = useState("ambos");
  const [newIncomeRecurring, setNewIncomeRecurring] = useState(false);

  // Savings form
  const [newSavingsName, setNewSavingsName] = useState("");
  const [newSavingsEmoji, setNewSavingsEmoji] = useState("🎯");
  const [newSavingsTarget, setNewSavingsTarget] = useState("");

  // Deposit
  const [depositId, setDepositId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const loading = loadingExpenses || loadingIncome || loadingSavings;

  const monthExpenses = useMemo(() => expenses.filter((i) => i.date?.startsWith(viewMonth)), [expenses, viewMonth]);
  const monthIncomes = useMemo(() => incomes.filter((i) => i.date?.startsWith(viewMonth)), [incomes, viewMonth]);

  const totalExpenses = useMemo(() => monthExpenses.reduce((s, i) => s + i.amount, 0), [monthExpenses]);
  const totalIncome = useMemo(() => monthIncomes.reduce((s, i) => s + i.amount, 0), [monthIncomes]);
  const balance = totalIncome - totalExpenses;

  const changeMonth = (delta: number) => {
    const [y, m] = viewMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  }, [viewMonth]);

  const handleAddExpense = async () => {
    const name = newName.trim();
    const amount = parseFloat(newAmount);
    if (!name || !amount) return;
    await addExpense({ name, amount, category: newCategory, paidBy: newPayer, date: new Date().toISOString().split("T")[0] });
    setNewName(""); setNewAmount(""); setShowAdd(false);
  };

  const handleAddIncome = async () => {
    const name = newIncomeName.trim();
    const amount = parseFloat(newIncomeAmount);
    if (!name || !amount) return;
    await addIncome({ name, amount, owner: newIncomeOwner, recurring: newIncomeRecurring, date: new Date().toISOString().split("T")[0] });
    setNewIncomeName(""); setNewIncomeAmount(""); setNewIncomeRecurring(false); setShowAdd(false);
  };

  const handleAddSavings = async () => {
    const name = newSavingsName.trim();
    const target = parseFloat(newSavingsTarget);
    if (!name || !target) return;
    await addSavings({ name, emoji: newSavingsEmoji, targetAmount: target, currentAmount: 0 });
    setNewSavingsName(""); setNewSavingsTarget(""); setShowAdd(false);
  };

  const handleDeposit = async (goal: SavingsGoal) => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    await updateSavings(goal.id, { currentAmount: goal.currentAmount + amount });
    setDepositId(null); setDepositAmount("");
  };

  return (
    <div className="flex flex-col h-full">
      <TabTip tabId="expenses" emoji="💰" titleKey="tutorial.expenses.title" tips={["tutorial.expenses.tip1", "tutorial.expenses.tip2", "tutorial.expenses.tip3", "tutorial.expenses.tip4", "tutorial.expenses.tip5"]} />
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-emerald-100/40">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-emerald-600">💰 {t("expenses.title")}</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white flex items-center justify-center text-lg active:scale-90 transition-all shadow-sm"
          >
            +
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} className="text-emerald-400 px-2 py-1 active:scale-90">←</button>
          <span className="text-sm font-semibold text-emerald-700 capitalize">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="text-emerald-400 px-2 py-1 active:scale-90">→</button>
        </div>

        {/* Balance summary */}
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-emerald-400">{t("expenses.income.label")}</p>
            <p className="text-sm font-bold text-green-600">{totalIncome.toFixed(0)}€</p>
          </div>
          <div>
            <p className="text-xs text-emerald-400">{t("expenses.expenses.label")}</p>
            <p className="text-sm font-bold text-red-500">{totalExpenses.toFixed(0)}€</p>
          </div>
          <div>
            <p className="text-xs text-emerald-400">{t("expenses.balance")}</p>
            <p className={`text-sm font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{balance >= 0 ? "+" : ""}{balance.toFixed(0)}€</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 mt-3">
          {(["expenses", "income", "savings"] as SubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setSubTab(tab); setShowAdd(false); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                subTab === tab ? "bg-emerald-200 text-emerald-700" : "bg-emerald-50 text-emerald-400"
              }`}
            >
              {tab === "expenses" ? "💸" : tab === "income" ? "💵" : "🏦"} {t(`expenses.subtab.${tab}`)}
            </button>
          ))}
        </div>

        {/* Add forms */}
        {showAdd && subTab === "expenses" && (
          <div className="mt-3 space-y-2 animate-expand">
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("expenses.placeholder")}
                className="flex-1 rounded-2xl border border-emerald-200/60 bg-white/80 px-4 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300" autoFocus />
              <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="€"
                className="w-20 rounded-2xl border border-emerald-200/60 bg-white/80 px-3 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setNewCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 ${newCategory === cat.id ? "bg-emerald-200 text-emerald-700" : "bg-emerald-50 text-emerald-500"}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {memberNames.map((m) => (
                <button key={m.key} onClick={() => setNewPayer(m.key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 ${newPayer === m.key ? "bg-emerald-200 text-emerald-700" : "bg-emerald-50 text-emerald-500"}`}>
                  {m.key === "ambos" ? <span>👫</span> : <MiniAvatar name={m.key} size={18} showEquipBadge={false} />} {m.label}
                </button>
              ))}
            </div>
            <button onClick={handleAddExpense} disabled={!newName.trim() || !newAmount}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-30">
              {t("expenses.addExpense")}
            </button>
          </div>
        )}

        {showAdd && subTab === "income" && (
          <div className="mt-3 space-y-2 animate-expand">
            <div className="flex gap-2">
              <input type="text" value={newIncomeName} onChange={(e) => setNewIncomeName(e.target.value)} placeholder={t("expenses.income.placeholder")}
                className="flex-1 rounded-2xl border border-emerald-200/60 bg-white/80 px-4 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300" autoFocus />
              <input type="number" value={newIncomeAmount} onChange={(e) => setNewIncomeAmount(e.target.value)} placeholder="€"
                className="w-20 rounded-2xl border border-emerald-200/60 bg-white/80 px-3 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300" />
            </div>
            <div className="flex gap-2">
              {memberNames.map((m) => (
                <button key={m.key} onClick={() => setNewIncomeOwner(m.key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 ${newIncomeOwner === m.key ? "bg-emerald-200 text-emerald-700" : "bg-emerald-50 text-emerald-500"}`}>
                  {m.key === "ambos" ? <span>👫</span> : <MiniAvatar name={m.key} size={18} showEquipBadge={false} />} {m.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 px-1">
              <input type="checkbox" checked={newIncomeRecurring} onChange={(e) => setNewIncomeRecurring(e.target.checked)}
                className="rounded border-emerald-300 text-emerald-500 focus:ring-emerald-200" />
              <span className="text-xs text-emerald-600">{t("expenses.income.recurring")}</span>
            </label>
            <button onClick={handleAddIncome} disabled={!newIncomeName.trim() || !newIncomeAmount}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-30">
              {t("expenses.income.add")}
            </button>
          </div>
        )}

        {showAdd && subTab === "savings" && (
          <div className="mt-3 space-y-2 animate-expand">
            <div className="flex gap-1 flex-wrap">
              {SAVINGS_EMOJIS.map((e) => (
                <button key={e} onClick={() => setNewSavingsEmoji(e)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all active:scale-90 ${newSavingsEmoji === e ? "bg-emerald-200 scale-110" : "bg-emerald-50 hover:bg-emerald-100"}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSavingsName} onChange={(e) => setNewSavingsName(e.target.value)} placeholder={t("expenses.savings.placeholder")}
                className="flex-1 rounded-2xl border border-emerald-200/60 bg-white/80 px-4 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300" autoFocus />
              <input type="number" value={newSavingsTarget} onChange={(e) => setNewSavingsTarget(e.target.value)} placeholder={t("expenses.savings.target") + " €"}
                className="w-24 rounded-2xl border border-emerald-200/60 bg-white/80 px-3 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300" />
            </div>
            <button onClick={handleAddSavings} disabled={!newSavingsName.trim() || !newSavingsTarget}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-30">
              {t("expenses.savings.add")}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="text-center text-emerald-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm">{t("common.loading")}</p>
          </div>
        )}

        {/* EXPENSES TAB */}
        {!loading && subTab === "expenses" && (
          <>
            {/* Charts */}
            <ExpenseCharts
              monthExpenses={monthExpenses}
              allExpenses={expenses}
              allIncomes={incomes}
              categories={EXPENSE_CATEGORIES}
              memberNames={memberNames}
              viewMonth={viewMonth}
            />

            {/* Expense list */}
            <div className="space-y-2">
              {monthExpenses.map((item) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
                return (
                  <div key={item.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-emerald-100/30 flex items-center gap-3">
                    <span className="text-lg">{cat?.emoji || "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5">
                        <MiniAvatar name={item.paidBy} size={16} />
                        <p className="text-[11px] text-emerald-400">{item.date} • {memberNames.find((m) => m.key === item.paidBy)?.label || item.paidBy}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{item.amount.toFixed(2)}€</span>
                    <button onClick={() => removeExpense(item.id)} className="w-7 h-7 flex items-center justify-center text-emerald-300 hover:text-red-400 transition-all active:scale-90 text-xs">✕</button>
                  </div>
                );
              })}
            </div>

            {monthExpenses.length === 0 && (
              <div className="text-center text-emerald-300 py-12">
                <div className="text-5xl mb-3 animate-float">💸</div>
                <p className="text-sm">{t("expenses.empty")}</p>
              </div>
            )}
          </>
        )}

        {/* INCOME TAB */}
        {!loading && subTab === "income" && (
          <>
            {monthIncomes.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-emerald-600">{t("expenses.total")}</p>
                  <p className="text-lg font-bold text-green-600">{totalIncome.toFixed(0)}€</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {monthIncomes.map((item) => (
                <div key={item.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-emerald-100/30 flex items-center gap-3">
                  <span className="text-lg">💵</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5">
                      <MiniAvatar name={item.owner} size={16} />
                      <p className="text-[11px] text-emerald-400">
                        {item.date} • {memberNames.find((m) => m.key === item.owner)?.label || item.owner}
                        {item.recurring && <span className="ml-1 text-green-500 font-medium">🔄</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">+{item.amount.toFixed(2)}€</span>
                  <button onClick={() => removeIncome(item.id)} className="w-7 h-7 flex items-center justify-center text-emerald-300 hover:text-red-400 transition-all active:scale-90 text-xs">✕</button>
                </div>
              ))}
            </div>

            {monthIncomes.length === 0 && (
              <div className="text-center text-emerald-300 py-12">
                <div className="text-5xl mb-3 animate-float">💵</div>
                <p className="text-sm">{t("expenses.income.empty")}</p>
              </div>
            )}
          </>
        )}

        {/* SAVINGS TAB */}
        {!loading && subTab === "savings" && (
          <>
            <div className="space-y-3">
              {savingsGoals.map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                const isComplete = pct >= 100;
                return (
                  <div key={goal.id} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border transition-all ${isComplete ? "border-green-200/60 bg-green-50/30" : "border-emerald-100/30"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-800">{goal.name}</p>
                        <p className="text-xs text-emerald-400">{goal.currentAmount.toFixed(0)}€ / {goal.targetAmount.toFixed(0)}€</p>
                      </div>
                      {isComplete && <span className="text-lg">🎉</span>}
                      <button onClick={() => removeSavings(goal.id)} className="w-7 h-7 flex items-center justify-center text-emerald-300 hover:text-red-400 transition-all active:scale-90 text-xs">✕</button>
                    </div>

                    {/* Progress bar */}
                    <div className="h-3 bg-emerald-100 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-emerald-300 to-teal-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-medium">{pct.toFixed(0)}%</span>
                      {!isComplete && (
                        depositId === goal.id ? (
                          <div className="flex gap-1.5">
                            <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="€"
                              className="w-16 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-800 focus:outline-none" autoFocus />
                            <button onClick={() => handleDeposit(goal)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-400 text-white text-xs font-medium active:scale-95">✓</button>
                            <button onClick={() => { setDepositId(null); setDepositAmount(""); }}
                              className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-500 text-xs active:scale-95">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setDepositId(goal.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-medium hover:bg-emerald-200 transition-all active:scale-95">
                            + {t("expenses.savings.deposit")}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {savingsGoals.length === 0 && (
              <div className="text-center text-emerald-300 py-12">
                <div className="text-5xl mb-3 animate-float">🎯</div>
                <p className="text-sm">{t("expenses.savings.empty")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
