"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";
import { getPeople } from "@/services/peopleService";
import { createSplit } from "@/services/splitService";
import { buildWhatsAppMessage, openWhatsApp } from "@/utils/whatsapp";

type Mode = "ME" | "SPLIT" | "PARTITION";

export default function PayPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<Mode>("ME");
  const [people, setPeople] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- AUTH ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
    });
  }, [router]);

  // ---------- LOAD PEOPLE ----------
  useEffect(() => {
    getPeople().then(setPeople);
  }, []);

  const total = Number(amount) || 0;

  // ---------- PARTICIPANT COUNT ----------
  const participantCount =
    mode === "SPLIT" ? selectedIds.length + 1 : selectedIds.length;

  // ---------- SPLIT AMOUNT ----------
  const splitAmount =
    mode === "SPLIT" && participantCount > 0
      ? Math.floor(total / participantCount)
      : 0;

  // ---------- PARTITION SUM ----------
  const partitionSum = useMemo(() => {
    return Object.values(customAmounts).reduce(
      (s, x) => s + (x || 0),
      0
    );
  }, [customAmounts]);

  // ---------- MY SHARE (FIXED) ----------
  const myAmount =
    mode === "ME"
      ? total
      : mode === "SPLIT"
      ? splitAmount
      : total - partitionSum;

  // ---------- VALIDATION ----------
  function validate() {
    if (!total || total <= 0) {
      setError("Enter a valid amount");
      return false;
    }

    if (mode !== "ME" && selectedIds.length === 0) {
      setError("Select at least one person");
      return false;
    }

    if (mode === "PARTITION" && partitionSum > total) {
      setError("Partition amounts exceed total");
      return false;
    }

    if (myAmount < 0) {
      setError("Invalid amount distribution");
      return false;
    }

    return true;
  }

  // ---------- PAY ----------
  async function handlePay() {
    if (!validate()) return;

    setError("");
    setLoading(true);

    // 🔑 Participants = people who owe YOU
    const participants =
      mode === "ME"
        ? []
        : selectedIds.map((id) => {
            const p = people.find((x) => x.id === id);
            return {
              name: p.name,
              phone: p.phone,
              amount:
                mode === "SPLIT"
                  ? splitAmount
                  : customAmounts[id] || 0,
            };
          });

    const paymentId = await createSplit({
      totalAmount: total,
      purpose: "Payment",
      participants,
    });

    // ---------- WHATSAPP ----------
    participants.forEach((p) => {
      const link = `${window.location.origin}/pay/${paymentId}`;
      const msg = buildWhatsAppMessage({
        payerName: p.name,
        amount: p.amount,
        purpose: "Payment",
        paymentLink: link,
      });
      openWhatsApp(p.phone, msg);
    });

    setLoading(false);
    router.push(`/pay/${paymentId}`);
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-3">Pay</h1>

      {/* AMOUNT */}
      <input
        type="number"
        placeholder="Total amount"
        className="border p-2 w-full mb-3"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* MODE */}
      <div className="flex gap-2 mb-3 text-sm">
        {(["ME", "SPLIT", "PARTITION"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`border px-3 py-1 rounded ${
              mode === m ? "bg-black text-white" : ""
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* PEOPLE */}
      {mode !== "ME" && (
        <div className="mb-3">
          <div className="text-sm font-semibold mb-1">
            Select People
          </div>

          {people.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 mb-1 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={(e) => {
                  setSelectedIds((prev) =>
                    e.target.checked
                      ? [...prev, p.id]
                      : prev.filter((x) => x !== p.id)
                  );
                }}
              />
              {p.name}
            </label>
          ))}
        </div>
      )}

      {/* PARTITION INPUT */}
      {mode === "PARTITION" &&
        selectedIds.map((id) => {
          const p = people.find((x) => x.id === id);
          return (
            <input
              key={id}
              type="number"
              className="border p-2 w-full mb-2"
              placeholder={`${p.name} amount`}
              onChange={(e) =>
                setCustomAmounts({
                  ...customAmounts,
                  [id]: Number(e.target.value),
                })
              }
            />
          );
        })}

      {/* SUMMARY */}
      <div className="border p-2 text-sm mb-3">
        <div>Me: ₹{myAmount}</div>

        {mode !== "ME" &&
          selectedIds.map((id) => {
            const p = people.find((x) => x.id === id);
            const amt =
              mode === "SPLIT"
                ? splitAmount
                : customAmounts[id] || 0;
            return (
              <div key={id}>
                {p.name}: ₹{amt}
              </div>
            );
          })}
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-black text-white w-full p-3 rounded"
      >
        {loading ? "Processing..." : "Pay"}
      </button>
    </main>
  );
}
