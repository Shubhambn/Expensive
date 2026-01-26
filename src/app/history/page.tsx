"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/db/supabase";

/* ---------------- TYPES ---------------- */

type Payment = {
  id: string;
  purpose: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type Participant = {
  payment_id: string;
  name: string;
  amount: number;
  status: string;
  payment_utr: string | null;
};

/* ---------------- COUNT UP ---------------- */

function useCountUp(value: number) {
  const [v, setV] = useState(0);

  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.floor(value / 18));
    const t = setInterval(() => {
      cur += step;
      if (cur >= value) {
        cur = value;
        clearInterval(t);
      }
      setV(cur);
    }, 28);
    return () => clearInterval(t);
  }, [value]);

  return v;
}

/* ---------------- PAGE ---------------- */

export default function HistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [parts, setParts] = useState<Participant[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("owner_user_id", userData.user.id)
      .order("created_at", { ascending: false });

    const { data: participants } = await supabase
      .from("payment_participants")
      .select("*")
      .eq("owner_user_id", userData.user.id);

    setPayments(payments ?? []);
    setParts(participants ?? []);
    setLoading(false);
  }

  /* ---- UNIQUE PEOPLE ---- */
  const people = useMemo(
    () => Array.from(new Set(parts.map(p => p.name))),
    [parts]
  );

  /* ---- GROUP PAYMENTS ---- */
  const grouped = useMemo(() => {
    return payments
      .map(p => ({
        ...p,
        equity: parts.filter(e => e.payment_id === p.id),
      }))
      .filter(p =>
        filter === "ALL"
          ? true
          : p.equity.some(e => e.name === filter)
      );
  }, [payments, parts, filter]);

  /* ---- HUD ---- */
  const receivedVal = grouped
    .flatMap(p => p.equity)
    .filter(e => e.status === "PAID")
    .reduce((s, e) => s + e.amount, 0);

  const pendingVal = grouped
    .flatMap(p => p.equity)
    .filter(e => e.status !== "PAID")
    .reduce((s, e) => s + e.amount, 0);

  const received = useCountUp(receivedVal);
  const pending = useCountUp(pendingVal);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center text-sm">
        ⛏ Loading world data…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 max-w-md mx-auto font-mono space-y-6">
      {/* HEADER */}
      <div className="border-2 border-white/30 px-4 py-3 tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.1)]">
        HISTORY<span className="text-red-500">_</span>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-green-500/50 p-3 text-green-400 shadow-[0_0_12px_rgba(0,255,0,0.15)]">
          <div className="text-[10px] tracking-widest mb-1">RECEIVED</div>
          <div className="text-lg">₹{received}</div>
        </div>

        <div className="border-2 border-yellow-500/50 p-3 text-yellow-400 shadow-[0_0_12px_rgba(255,255,0,0.15)]">
          <div className="text-[10px] tracking-widest mb-1">PENDING</div>
          <div className="text-lg">₹{pending}</div>
        </div>
      </div>

      {/* FILTER */}
      <div className="border-2 border-white/30 p-2">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-black text-white p-2 outline-none tracking-wide"
        >
          <option value="ALL">ALL PLAYERS</option>
          {people.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* PAYMENT BLOCKS */}
      {grouped.map(p => (
        <div
          key={p.id}
          className="border-2 border-white/20 p-4 space-y-3 hover:border-red-500 transition shadow-[0_0_10px_rgba(255,0,0,0.1)]"
        >
          {/* TITLE */}
          <div className="text-base tracking-wide">
            {p.purpose}
          </div>

          {/* META */}
          <div className="flex justify-between text-sm">
            <span>₹{p.total_amount}</span>
            <span className="text-yellow-400">{p.status}</span>
          </div>

          <div className="text-xs text-white/40">
            {new Date(p.created_at).toLocaleString()}
          </div>

          {/* EQUITY */}
          <div className="border-t-2 border-white/10 pt-2 space-y-1">
            <div className="text-[10px] tracking-widest text-white/40">
              EQUITY
            </div>

            {p.equity.map(e => {
              const highlight = filter !== "ALL" && e.name === filter;
              return (
                <div
                  key={e.name}
                  className={`flex justify-between px-1 ${
                    highlight
                      ? "text-red-400 font-semibold bg-red-500/10"
                      : "text-white/70"
                  }`}
                >
                  <span>{e.name}</span>
                  <span>₹{e.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}
