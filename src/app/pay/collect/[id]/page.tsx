"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/db/supabase";
import { generateUpiLink } from "@/utils/upi";
import { PAYEE } from "../../../../../public/config/Mvp";

type Method = "UPI" | "CASH";
type UpiApp = "GPAY" | "PHONEPE" | "PAYTM" | "ANY";

/* ========= MVP PAYEE CONFIG ========= */
const PAYEE_NAME = PAYEE.name;
const PAYEE_UPI = PAYEE.upiId;

export default function CollectPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);

  const [method, setMethod] = useState<Method | null>(null);
  const [showUpiApps, setShowUpiApps] = useState(false);

  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------- LOAD REQUEST ---------- */
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Invalid or expired payment link");
      } else {
        setRequest(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  /* ---------- STATES ---------- */
  if (loading) {
    return <div className="p-4 text-center text-white/60">Loading…</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  const createdAt = new Date(request.created_at).toLocaleString();

  /* ---------- HARD LOCK ---------- */
  if (request.status !== "PENDING") {
    return (
      <main className="min-h-screen bg-black p-4 max-w-md mx-auto space-y-4 text-white">
        <h1 className="text-xl font-bold text-red-500 text-center">
          Payment Status
        </h1>

        <div className="border border-white/30 rounded p-4 space-y-2">
          <div className="font-semibold">{request.note}</div>
          <div>Amount: ₹{request.amount}</div>

          <div className="text-red-500 font-semibold">
            ✅ Payment already completed
          </div>

          {request.payment_reference && (
            <div className="text-xs text-white/50">
              Ref: {request.payment_reference}
            </div>
          )}

          {request.paid_at && (
            <div className="text-xs text-white/40">
              Paid on {new Date(request.paid_at).toLocaleString()}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ---------- OPEN UPI ---------- */
  function openUpi(app: UpiApp) {
    if (!PAYEE_UPI) {
      setError("UPI configuration missing");
      return;
    }

    const link = generateUpiLink({
      app,
      payeeUpiId: PAYEE_UPI,
      payeeName: PAYEE_NAME,
      amount: request.amount,
      note: request.note,
    });

    window.location.href = link;
  }

  /* ---------- CONFIRM PAID ---------- */
  async function confirmPaid() {
    if (method === "UPI" && !utr.trim()) {
      setError("UTR / Reference is required");
      return;
    }

    setSubmitting(true);
    setError("");

    const { error } = await supabase
      .from("payment_requests")
      .update({
        status: method === "UPI" ? "PAID_UPI" : "PAID_CASH",
        payment_reference: method === "UPI" ? utr.trim() : null,
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "PENDING");

    if (error) {
      setError("Failed to confirm payment");
      setSubmitting(false);
      return;
    }

    setRequest({
      ...request,
      status: method === "UPI" ? "PAID_UPI" : "PAID_CASH",
      payment_reference: utr || null,
      paid_at: new Date().toISOString(),
    });

    setSubmitting(false);
  }

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-black p-4 max-w-md mx-auto space-y-5 text-white">
      <h1 className="text-xl font-bold text-red-500 text-center">
        Hello {request.person_name} 👋
      </h1>

      {/* DETAILS */}
      <div className="border border-white/30 rounded p-4 space-y-2">
        <div className="text-sm text-white/50">
          Requested on {createdAt}
        </div>

        <div className="font-semibold">{request.note}</div>

        <div className="flex justify-between items-center">
          <span className="text-white/60">Amount</span>
          <span className="text-2xl font-bold text-red-500">
            ₹{request.amount}
          </span>
        </div>

        <div className="text-sm text-white/60">
          Pay to <b>{PAYEE_NAME}</b>
        </div>
      </div>

      {/* METHOD */}
      <div className="space-y-2">
        <button
          onClick={() => {
            setMethod("UPI");
            setShowUpiApps(true);
            setError("");
          }}
          className={`border w-full py-3 rounded text-center ${
            method === "UPI" ? "text-red-500 border-red-500" : "border-white/30"
          }`}
        >
          UPI
        </button>

        <button
          onClick={() => {
            setMethod("CASH");
            setShowUpiApps(false);
            setError("");
          }}
          className={`border w-full py-3 rounded text-center ${
            method === "CASH" ? "text-red-500 border-red-500" : "border-white/30"
          }`}
        >
          Cash
        </button>
      </div>

      {/* UPI APPS */}
      {method === "UPI" && showUpiApps && (
        <div className="border border-white/30 rounded p-3 space-y-2">
          {(["GPAY", "PHONEPE", "PAYTM", "ANY"] as UpiApp[]).map((a) => (
            <button
              key={a}
              onClick={() => openUpi(a)}
              className="border border-white/30 w-full py-2 rounded text-left hover:text-red-500"
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* CONFIRM */}
      {method && (
        <div className="border border-white/30 rounded p-4 space-y-3">
          {method === "UPI" && (
            <input
              className="border border-white/30 bg-transparent p-3 w-full rounded text-white"
              placeholder="UTR / Reference Number"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
            />
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            onClick={confirmPaid}
            disabled={submitting}
            className="w-full py-3 rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition"
          >
            {submitting ? "Confirming…" : "I Have Paid"}
          </button>
        </div>
      )}
    </main>
  );
}
