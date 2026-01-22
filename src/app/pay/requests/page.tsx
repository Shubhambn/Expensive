// src/app/pay/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";

type PaymentRequest = {
  id: string;
  person_name: string;
  amount: number;
  note: string;
  status: "PENDING" | "PAID" | "PAID_UPI" | "PAID_CASH";
  payment_reference: string | null;
  created_at: string;
};

export default function PaymentRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);

  /* ---------- LOAD REQUESTS ---------- */
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("payment_requests")
        .select(
          "id, person_name, amount, note, status, payment_reference, created_at"
        )
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRequests(data);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  /* ---------- UI ---------- */
  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">Payment Requests</h1>

      {loading && (
        <div className="text-sm text-gray-500">Loading requests…</div>
      )}

      {!loading && requests.length === 0 && (
        <div className="text-sm text-gray-500">
          No payment requests yet.
        </div>
      )}

      {/* REQUEST LIST */}
      <div className="space-y-3">
        {requests.map((r) => {
          const paid = r.status !== "PENDING";

          return (
            <div
              key={r.id}
              className="border rounded-lg p-3 space-y-1"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{r.person_name}</div>
                <div className="font-bold">₹{r.amount}</div>
              </div>

              <div className="text-sm text-gray-600">{r.note}</div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </span>

                <span
                  className={`font-semibold ${
                    paid ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {paid ? "PAID" : "PENDING"}
                </span>
              </div>

              {paid && r.payment_reference && (
                <div className="text-xs text-gray-500">
                  Ref: {r.payment_reference}
                </div>
              )}

              {!paid && (
                <button
                  onClick={() =>
                    router.push(`/pay/collect/${r.id}`)
                  }
                  className="mt-2 text-sm underline text-black"
                >
                  Open payment link →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
