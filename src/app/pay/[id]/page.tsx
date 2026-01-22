"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/db/supabase";

export default function PayConfirmPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          purpose,
          total_amount,
          payment_participants (
            id,
            name,
            phone,
            amount,
            status,
            payment_method,
            payment_utr
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        setError("Invalid or expired payment link");
      } else {
        setPayment(data);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-2">Payment Confirmation</h1>

      <div className="border p-3 mb-4">
        <div className="font-semibold">{payment.purpose}</div>
        <div>Total: ₹{payment.total_amount}</div>
      </div>

      {payment.payment_participants.map((p: any) => (
        <ParticipantCard key={p.id} participant={p} />
      ))}
    </main>
  );
}

function ParticipantCard({ participant }: { participant: any }) {
  const [utr, setUtr] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState(participant.status);
  const [error, setError] = useState("");

  // ---------- UPI / ATM ----------
  async function submitDigital(method: "UPI" | "ATM") {
    if (!utr.trim()) {
      setError("Enter payment reference / UTR");
      return;
    }

    const { error } = await supabase
      .from("payment_participants")
      .update({
        payment_method: method,
        payment_utr: utr.trim().toUpperCase(),
        status: "SUCCESS",
      })
      .eq("id", participant.id);

    if (error) {
      setError("This payment reference may already exist");
    } else {
      setStatus("SUCCESS");
    }
  }

  // ---------- CASH ----------
  async function requestCash() {
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    await supabase
      .from("payment_participants")
      .update({
        payment_method: "CASH",
        cash_otp: generatedOtp,
        status: "CASH_PENDING",
      })
      .eq("id", participant.id);

    alert("Cash OTP generated. Share with payer.");
    setStatus("CASH_PENDING");
  }

  async function verifyCash() {
    if (!otp.trim()) {
      setError("Enter OTP");
      return;
    }

    const { data } = await supabase
      .from("payment_participants")
      .select("cash_otp")
      .eq("id", participant.id)
      .single();

    if (data?.cash_otp !== otp) {
      setError("Invalid OTP");
      return;
    }

    await supabase
      .from("payment_participants")
      .update({
        status: "SUCCESS",
      })
      .eq("id", participant.id);

    setStatus("SUCCESS");
  }

  return (
    <div className="border p-3 mb-3 text-sm rounded">
      <div className="font-semibold">
        {participant.name} — ₹{participant.amount}
      </div>

      <div className="text-gray-600 mb-2">
        Status: {status}
      </div>

      {status === "PENDING" && (
        <>
          <input
            className="border p-1 w-full mb-1"
            placeholder="Payment ID / UTR"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
          />

          <button
            onClick={() => submitDigital("UPI")}
            className="bg-black text-white w-full p-1 mb-2"
          >
            Paid via UPI
          </button>

          <button
            onClick={() => submitDigital("ATM")}
            className="border w-full p-1 mb-2"
          >
            Paid via ATM
          </button>

          <button
            onClick={requestCash}
            className="border w-full p-1"
          >
            Pay by Cash
          </button>
        </>
      )}

      {status === "CASH_PENDING" && (
        <>
          <input
            className="border p-1 w-full mb-1"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button
            onClick={verifyCash}
            className="bg-black text-white w-full p-1"
          >
            Confirm Cash Payment
          </button>
        </>
      )}

      {error && (
        <div className="text-red-600 mt-1">{error}</div>
      )}
    </div>
  );
}
