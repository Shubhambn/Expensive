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
    <main className="min-h-screen bg-black p-4 max-w-md mx-auto space-y-4 text-white">
      <h1 className="text-xl font-bold text-red-500">
        Payment Requests
      </h1>

      {loading && (
        <div className="text-sm text-white/60">
          Loading requests…
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="text-sm text-white/60">
          No payment requests yet.
        </div>
      )}

      {/* REQUEST LIST */}
      <div className="space-y-3">
        {requests.map((r) => {
          const paid = r.status !== "PENDING";
          const createdAt = new Date(r.created_at);

          return (
            <div
              key={r.id}
              className="border border-white/30 rounded p-3 space-y-2"
            >
              {/* TOP */}
              <div className="flex justify-between items-center">
                <div className="font-semibold">
                  {r.person_name}
                </div>
                <div className="font-bold text-red-500">
                  ₹{r.amount}
                </div>
              </div>

              {/* NOTE */}
              <div className="text-sm text-white/70">
                {r.note}
              </div>

              {/* DATE + STATUS */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40">
                  Requested on{" "}
                  {createdAt.toLocaleDateString()}{" "}
                  {createdAt.toLocaleTimeString()}
                </span>

                <span
                  className={`font-semibold ${
                    paid
                      ? "text-red-500"
                      : "text-white/60"
                  }`}
                >
                  {paid ? "PAID" : "PENDING"}
                </span>
              </div>

              {/* REFERENCE */}
              {paid && r.payment_reference && (
                <div className="text-xs text-white/40">
                  Ref: {r.payment_reference}
                </div>
              )}

              {/* ACTION */}
              {!paid && (
                <button
                  onClick={() =>
                    router.push(`/pay/collect/${r.id}`)
                  }
                  className="text-sm text-red-500 underline"
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
