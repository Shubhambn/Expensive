"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/db/supabase";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load history");
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-4 text-center">Loading…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">History</h1>

      {rows.length === 0 && (
        <div className="text-sm text-gray-500 text-center">
          No payments yet
        </div>
      )}

      {rows.map((r) => (
        <HistoryCard key={r.id} row={r} />
      ))}
    </main>
  );
}

/* ---------- CARD ---------- */
function HistoryCard({ row }: { row: any }) {
  const isPaid = row.status !== "PENDING";

  return (
    <div className="border rounded-lg p-3 space-y-1 text-sm">
      <div className="font-semibold">{row.note}</div>

      <div className="flex justify-between">
        <span>{row.person_name}</span>
        <span className="font-semibold">₹{row.amount}</span>
      </div>

      <div className="text-xs text-gray-500">
        {new Date(row.created_at).toLocaleString()}
      </div>

      {/* STATUS */}
      {isPaid ? (
        <div className="text-green-600 font-semibold mt-1">
          ✅ Paid {row.status === "PAID_UPI" ? "(UPI)" : "(Cash)"}
        </div>
      ) : (
        <div className="text-yellow-600 font-semibold mt-1">
          ⏳ Pending
        </div>
      )}

      {/* UTR */}
      {row.payment_reference && (
        <div className="text-xs text-gray-500">
          Ref: {row.payment_reference}
        </div>
      )}
    </div>
  );
}
