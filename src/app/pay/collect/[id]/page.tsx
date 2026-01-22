"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/db/supabase";
import { generateUpiLink } from "@/utils/upi";

type Method = "UPI" | "CASH";
type UpiApp = "GPAY" | "PHONEPE" | "PAYTM" | "ANY";

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

  /* ---------- LOADING / ERROR ---------- */
  if (loading) {
    return <div className="p-4 text-center">Loading…</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  /* ---------- ALREADY PAID (HARD LOCK) ---------- */
  if (request.status !== "PENDING") {
    return (
      <main className="p-4 max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-bold text-center">
          Payment Status
        </h1>

        <div className="border rounded-lg p-4 space-y-2">
          <div className="font-semibold">
            {request.note}
          </div>

          <div>
            Amount: <b>₹{request.amount}</b>
          </div>

          <div className="text-green-700 font-semibold">
            ✅ You have already paid
          </div>

          {request.payment_reference && (
            <div className="text-xs text-gray-500">
              Reference: {request.payment_reference}
            </div>
          )}

          {request.paid_at && (
            <div className="text-xs text-gray-400">
              Paid on{" "}
              {new Date(request.paid_at).toLocaleString()}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ---------- OPEN UPI ---------- */
  function openUpi(app: UpiApp) {
    setMethod("UPI");
    setError("");

    const link = generateUpiLink({
      app,
      payeeUpiId: request.payee_upi_id,
      payeeName: request.payee_name,
      amount: request.amount,
      note: request.note,
    });

    // Opens respective UPI app / chooser
    window.location.href = link;
  }

  /* ---------- CONFIRM PAYMENT ---------- */
  async function confirmPaid() {
    if (method === "UPI" && !utr.trim()) {
      setError("UTR / Reference is required for UPI payments");
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
      .eq("status", "PENDING"); // 🔒 double-submit protection

    if (error) {
      setError("Failed to confirm payment. Please try again.");
      setSubmitting(false);
      return;
    }

    // Update local state → triggers "Already Paid" UI
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
    <main className="p-4 max-w-md mx-auto space-y-5">
      <h1 className="text-xl font-bold text-center">
        Payment Request
      </h1>

      {/* PAYMENT SUMMARY */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="font-semibold">
          {request.note}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Amount to Pay
          </span>
          <span className="text-2xl font-bold">
            ₹{request.amount}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          Paying to{" "}
          <span className="font-semibold text-black">
            {request.payee_name}
          </span>
        </div>
      </div>

      {/* STEP 1 — METHOD */}
      <div className="space-y-2">
        <div className="text-sm font-semibold">
          Choose Payment Method
        </div>

        <button
          onClick={() => {
            setMethod("UPI");
            setShowUpiApps(true);
            setError("");
          }}
          className={`border w-full py-3 rounded ${
            method === "UPI" ? "bg-black text-white" : ""
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
          className={`border w-full py-3 rounded ${
            method === "CASH" ? "bg-black text-white" : ""
          }`}
        >
          Cash
        </button>
      </div>

      {/* STEP 2 — UPI APPS */}
      {method === "UPI" && showUpiApps && (
        <div className="border rounded-lg p-3 space-y-2">
          <div className="text-sm font-semibold">
            Select UPI App
          </div>

          {(["GPAY", "PHONEPE", "PAYTM", "ANY"] as UpiApp[]).map((a) => (
            <button
              key={a}
              onClick={() => openUpi(a)}
              className="border w-full py-3 rounded"
            >
              {a === "GPAY"
                ? "Google Pay"
                : a === "PHONEPE"
                ? "PhonePe"
                : a === "PAYTM"
                ? "Paytm"
                : "Any UPI App"}
            </button>
          ))}
        </div>
      )}

      {/* STEP 3 — CONFIRM */}
      {method && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="font-semibold">
            Confirm Payment
          </div>

          {method === "UPI" && (
            <input
              className="border p-3 w-full rounded"
              placeholder="Enter UTR / Reference Number"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
            />
          )}

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={confirmPaid}
            disabled={submitting}
            className="bg-black text-white w-full py-3 rounded"
          >
            {submitting ? "Confirming..." : "I Have Paid"}
          </button>
        </div>
      )}
    </main>
  );
}
