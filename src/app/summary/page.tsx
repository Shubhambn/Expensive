"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIncomingOutgoing } from "@/services/moneySummaryService";
import { supabase } from "@/db/supabase";

export default function SummaryPage() {
  const router = useRouter();

  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
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

  // ---------- LOAD SUMMARY ----------
  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getIncomingOutgoing();
      setIncoming(res.incoming);
      setOutgoing(res.outgoing);
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
    return <div className="p-4">Loading summary...</div>;
  }

  const incomingTotal = incoming.reduce((s, x) => s + x.amount, 0);
  const outgoingTotal = outgoing.reduce((s, x) => s + x.amount, 0);

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-3">Money Summary</h1>

      {/* ---- TOTALS ---- */}
      <div className="border p-3 mb-4 text-sm">
        <div>
          Incoming:{" "}
          <b className="text-green-600">₹{incomingTotal}</b>
        </div>
        <div>
          Outgoing:{" "}
          <b className="text-red-600">₹{outgoingTotal}</b>
        </div>
        <div className="mt-1">
          Net:{" "}
          <b
            className={
              incomingTotal - outgoingTotal >= 0
                ? "text-green-700"
                : "text-red-700"
            }
          >
            ₹{incomingTotal - outgoingTotal}
          </b>
        </div>
      </div>

      {/* ---- INCOMING ---- */}
      <h2 className="font-semibold mb-2 text-green-700">
        Incoming
      </h2>

      {incoming.length === 0 && (
        <div className="text-sm text-gray-500 mb-3">
          No incoming payments pending
        </div>
      )}

      {incoming.map((p) => (
        <div key={p.id} className="border p-2 mb-2 text-sm">
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
                : "text-gray-600"
            }
          >
            {p.status}
          </div>
        </div>
      ))}

      {/* ---- OUTGOING ---- */}
      <h2 className="font-semibold mt-4 mb-2 text-red-700">
        Outgoing
      </h2>

      {outgoing.length === 0 && (
        <div className="text-sm text-gray-500 mb-3">
          No outgoing payments pending
        </div>
      )}

      {outgoing.map((p) => (
        <div key={p.id} className="border p-2 mb-2 text-sm">
          <div className="flex justify-between">
            <span>{p.payment.purpose}</span>
            <span>₹{p.amount}</span>
          </div>
          <div
            className={
              p.status === "VERIFIED"
                ? "text-green-600"
                : p.status === "PAID_UNVERIFIED"
                ? "text-orange-600"
                : "text-gray-600"
            }
          >
            {p.status}
          </div>
        </div>
      ))}
    </main>
  );
}
