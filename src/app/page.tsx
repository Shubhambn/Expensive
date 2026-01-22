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

  // ---------- AUTH ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
      else setCheckingAuth(false);
    });
  }, [router]);

  // ---------- LOAD ----------
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPersonalExpenses();
      setLoading(false);
    })();
  }, [loadPersonalExpenses]);

  // ---------- CALCULATIONS ----------
  const personalSpent = useMemo(
    () => personalExpenses.reduce((s, e) => s + e.amount, 0),
    [personalExpenses]
  );

  // (Will be wired to split tables later)
  const incoming = 0;
  const outgoing = 0;

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
      <div className="border rounded p-3 text-sm">
        <div className="font-semibold mb-2 text-gray-700">
          Money Overview
        </div>

        <div className="flex justify-between">
          <span>Personal Spent</span>
          <span className="font-semibold">₹{personalSpent}</span>
        </div>

        <div className="flex justify-between text-green-700">
          <span>Incoming</span>
          <span>₹{incoming}</span>
        </div>

        <div className="flex justify-between text-red-700">
          <span>Outgoing</span>
          <span>₹{outgoing}</span>
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

      {/* STATE */}
      {loading && (
        <div className="text-center text-xs text-gray-500">
          Loading data…
        </div>
      )}
    </main>
  );
}
