"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";
import { useExpenseStore } from "@/store/useExpenseStore";

/* ---------- COUNT-UP ANIMATION HOOK ---------- */
function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf: number;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * value);
      setDisplay(current);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value); // hard stop
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

export default function Home() {
  const router = useRouter();
  const { personalExpenses, loadPersonalExpenses } = useExpenseStore();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
      else setCheckingAuth(false);
    });
  }, [router]);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    async function load() {
      setLoading(true);

      await loadPersonalExpenses();

      const { data } = await supabase
        .from("payment_requests")
        .select("amount, status");

      setPaymentRequests(data || []);
      setLoading(false);
    }

    load();
  }, [loadPersonalExpenses]);

  /* ---------- CALCULATIONS ---------- */
  const personalSpent = useMemo(
    () => personalExpenses.reduce((s, e) => s + e.amount, 0),
    [personalExpenses]
  );

  const incoming = useMemo(
    () =>
      paymentRequests
        .filter(
          (r) => r.status === "PAID_UPI" || r.status === "PAID_CASH"
        )
        .reduce((s, r) => s + r.amount, 0),
    [paymentRequests]
  );

  const pending = useMemo(
    () =>
      paymentRequests
        .filter((r) => r.status === "PENDING")
        .reduce((s, r) => s + r.amount, 0),
    [paymentRequests]
  );

  /* ---------- ANIMATED VALUES ---------- */
  const animSpent = useCountUp(personalSpent);
  const animIncoming = useCountUp(incoming);
  const animPending = useCountUp(pending);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (checkingAuth) {
    return (
      <div className="p-6 text-center text-xs text-white/40 font-mono">
        Booting system…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 max-w-md mx-auto space-y-5 font-mono">
      {/* HEADER */}
      <div className="flex justify-between items-center border border-white/20 p-3">
        <h1 className="text-lg tracking-wide">
          DASHBOARD<span className="text-red-500">_</span>
        </h1>
        <button
          onClick={logout}
          className="text-xs text-red-400 hover:text-red-300"
        >
          LOGOUT
        </button>
      </div>

      {/* MONEY HUD */}
      <div className="border border-white/20 p-4 space-y-3">
        <div className="text-xs text-white/60 tracking-widest">
          MONEY_STATUS
        </div>

        <div className="flex justify-between tabular-nums">
          <span className="text-white/60">SPENT</span>
          <span>₹{animSpent}</span>
        </div>

        <div className="flex justify-between text-green-400 tabular-nums">
          <span>RECEIVED</span>
          <span>₹{animIncoming}</span>
        </div>

        <div className="flex justify-between text-yellow-400 tabular-nums">
          <span>PENDING</span>
          <span>₹{animPending}</span>
        </div>

        <div className="flex justify-between text-white/30">
          <span>OUTGOING</span>
          <span>—</span>
        </div>
      </div>

      {/* PRIMARY ACTION */}
      <button
        onClick={() => router.push("/pay")}
        className="border border-red-500 text-red-500 w-full p-4 hover:bg-red-500 hover:text-black transition"
      >
        PAY
        <div className="text-[10px] text-white/50 mt-1">
          ME · SPLIT · PARTITION
        </div>
      </button>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <button
          onClick={() => router.push("/people")}
          className="border border-white/20 p-3 hover:border-white"
        >
          PEOPLE
        </button>

        <button
          onClick={() => router.push("/history")}
          className="border border-white/20 p-3 hover:border-white"
        >
          HISTORY
        </button>

        <button
          onClick={() => router.push("/summary")}
          className="border border-white/20 p-3 hover:border-white"
        >
          SUMMARY
        </button>

        <button
          onClick={() => router.push("/settings")}
          className="border border-white/20 p-3 hover:border-white"
        >
          SETTINGS
        </button>
      </div>

      {loading && (
        <div className="text-center text-xs text-white/40">
          Syncing data…
        </div>
      )}
    </main>
  );
}
