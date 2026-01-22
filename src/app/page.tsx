"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useExpenseStore } from "@/store/useExpenseStore";
import { supabase } from "@/db/supabase";

export default function Home() {
  const router = useRouter();

  const { personalExpenses, loadPersonalExpenses } = useExpenseStore();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  // ---------- AUTH GUARD ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/auth");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  // ---------- LOAD DATA ----------
  useEffect(() => {
    async function load() {
      setLoading(true);
      await loadPersonalExpenses();
      setLoading(false);
    }
    load();
  }, [loadPersonalExpenses]);

  // ---------- SUMMARY ----------
  const personalSpent = useMemo(() => {
    return personalExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [personalExpenses]);

  // Incoming / Outgoing will later come from split tables
  const incoming = 0;
  const outgoing = 0;

  // ---------- LOGOUT ----------
  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (checkingAuth) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Checking session...
      </div>
    );
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="text-xs text-red-600 underline"
        >
          Logout
        </button>
      </div>

      {/* ---------- OVERVIEW ---------- */}
      <div className="border rounded p-3 mb-5 text-sm">
        <div className="font-semibold mb-2 text-gray-700">
          Money Overview
        </div>

        <div className="flex justify-between mb-1">
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

      {/* ---------- PRIMARY ACTION ---------- */}
      <button
        onClick={() => router.push("/pay")}
        className="bg-black text-white w-full p-3 rounded mb-4 text-base"
      >
        💸 Pay
        <div className="text-xs text-gray-300 mt-1">
          Me · Split · Partition
        </div>
      </button>

      {/* ---------- SECONDARY ACTIONS ---------- */}
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
        <div className="text-center text-xs text-gray-500 mt-4">
          Loading data...
        </div>
      )}
    </main>
  );
}
