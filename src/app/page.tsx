"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";
import { useExpenseStore } from "@/store/useExpenseStore";

export default function Home() {
  const router = useRouter();
  const { personalExpenses, loadPersonalExpenses } = useExpenseStore();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/auth");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    async function load() {
      setLoading(true);

      // personal expenses
      await loadPersonalExpenses();

      // incoming money (payment requests)
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
        .filter((r) => r.status === "PAID")
        .reduce((s, r) => s + r.amount, 0),
    [paymentRequests]
  );

  const pending = useMemo(
    () =>
      paymentRequests
        .filter((r) => r.status === "CREATED")
        .reduce((s, r) => s + r.amount, 0),
    [paymentRequests]
  );

  // outgoing will be added later (correctly empty now)
  const outgoing = "—";

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (checkingAuth) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Checking session…
      </div>
    );
  }

  return (
    <main className="p-4 max-w-md mx-auto space-y-5">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="text-xs text-red-600 underline"
        >
          Logout
        </button>
      </div>

      {/* MONEY OVERVIEW */}
      <div className="border rounded p-3 text-sm space-y-1">
        <div className="font-semibold text-gray-700 mb-1">
          Money Overview
        </div>

        <div className="flex justify-between">
          <span>Personal Spent</span>
          <span className="font-semibold">₹{personalSpent}</span>
        </div>

        <div className="flex justify-between text-green-700">
          <span>Incoming (Received)</span>
          <span>₹{incoming}</span>
        </div>

        <div className="flex justify-between text-orange-600">
          <span>Pending to Collect</span>
          <span>₹{pending}</span>
        </div>

        <div className="flex justify-between text-red-700">
          <span>Outgoing</span>
          <span>{outgoing}</span>
        </div>
      </div>

      {/* PRIMARY ACTION */}
      <button
        onClick={() => router.push("/pay")}
        className="bg-black text-white w-full p-3 rounded text-base"
      >
        💸 Pay
        <div className="text-xs text-gray-300 mt-1">
          Me · Split · Partition
        </div>
      </button>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <button
          onClick={() => router.push("/people")}
          className="border p-2 rounded hover:bg-gray-50"
        >
          👥 People
        </button>

        <button
          onClick={() => router.push("/history")}
          className="border p-2 rounded hover:bg-gray-50"
        >
          📜 History
        </button>

        <button
          onClick={() => router.push("/summary")}
          className="border p-2 rounded hover:bg-gray-50"
        >
          📊 Summary
        </button>

        <button
          onClick={() => router.push("/settings")}
          className="border p-2 rounded hover:bg-gray-50"
        >
          ⚙️ Settings
        </button>
      </div>

      {loading && (
        <div className="text-center text-xs text-gray-500">
          Loading data…
        </div>
      )}
    </main>
  );
}
