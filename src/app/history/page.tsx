"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMySplitHistory } from "@/services/splitHistoryService";
import { buildWhatsAppMessage, openWhatsApp } from "@/utils/whatsapp";
import { supabase } from "@/db/supabase";

export default function HistoryPage() {
  const router = useRouter();

  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  // ---------- LOAD HISTORY ----------
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getMySplitHistory();
      setSplits(data || []);
      setLoading(false);
    }

    if (!checkingAuth) load();
  }, [checkingAuth]);

  if (checkingAuth) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Checking session...
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Loading history...</div>;
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-3">Split History</h1>

      {splits.length === 0 && (
        <div className="text-gray-500 text-sm">
          No split history yet
        </div>
      )}

      {splits.map((split) => (
        <div key={split.id} className="border p-3 mb-3">
          <div className="font-semibold">{split.purpose}</div>

          <div className="text-sm text-gray-600 mb-2">
            ₹{split.total_amount} •{" "}
            {new Date(split.created_at).toLocaleDateString()}
          </div>

          {split.payment_participants.map((p: any) => (
            <div
              key={p.id}
              className="border-t pt-2 mt-2 text-sm"
            >
              <div className="flex justify-between">
                <span>{p.name}</span>
                <span>₹{p.amount}</span>
              </div>

              <div
                className={
                  p.status === "VERIFIED"
                    ? "text-green-600"
                    : p.status === "PAID_UNVERIFIED"
                    ? "text-orange-600"
                    : p.status === "FALSE"
                    ? "text-red-600"
                    : "text-gray-600"
                }
              >
                {p.status}
              </div>

              {p.status === "PENDING" && (
                <button
                  className="text-blue-600 underline text-xs mt-1"
                  onClick={() => {
                    const link = `${window.location.origin}/pay/${split.id}`;
                    const msg = buildWhatsAppMessage({
                      payerName: p.name,
                      amount: p.amount,
                      purpose: split.purpose,
                      paymentLink: link,
                    });
                    openWhatsApp(p.phone, msg);
                  }}
                >
                  Send Reminder
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}
