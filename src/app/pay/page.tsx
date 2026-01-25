// src/app/pay/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";
import { getPeople } from "@/services/peopleService";

type Mode = "ME" | "SPLIT" | "PARTITION";
type Method = "UPI" | "CASH";

export default function PayPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<Mode>("ME");
  const [method, setMethod] = useState<Method | null>(null);

  const [people, setPeople] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
    });
    getPeople().then(setPeople);
  }, [router]);

  const total = Number(amount) || 0;

  const participantCount =
    mode === "SPLIT" ? selectedIds.length + 1 : selectedIds.length;

  const splitAmount =
    mode === "SPLIT" && participantCount > 0
      ? Math.floor(total / participantCount)
      : 0;

  const partitionSum = useMemo(
    () => Object.values(customAmounts).reduce((s, v) => s + (v || 0), 0),
    [customAmounts]
  );

  const myAmount =
    mode === "ME"
      ? total
      : mode === "SPLIT"
      ? splitAmount
      : Math.max(total - partitionSum, 0);

  function validate() {
    if (total <= 0) return setError("Enter valid amount"), false;
    if (!note.trim()) return setError("Note required"), false;
    if (mode !== "ME" && selectedIds.length === 0)
      return setError("Select people"), false;
    if (mode === "PARTITION" && partitionSum > total)
      return setError("Partition exceeds total"), false;
    if (!method) return setError("Select payment method"), false;

    setError("");
    return true;
  }

  function openUpiApp() {
    if (!validate()) return;
    window.location.href = "upi://pay";
  }

  function confirmPaid() {
    if (!validate()) return;

    sessionStorage.setItem(
      "payment_intent",
      JSON.stringify({
        amount: total,
        note,
        mode,
        method,
        selectedIds,
        splitAmount,
        customAmounts,
        myAmount,
        createdAt: new Date().toISOString(),
      })
    );

    router.push("/pay/confirm");
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 max-w-md mx-auto space-y-5">
      <h1 className="text-xl font-semibold">Pay</h1>

      {/* AMOUNT */}
      <input
        type="number"
        className="w-full bg-black border border-white/40 p-2 rounded text-white placeholder:text-white/40"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* NOTE */}
      <input
        className="w-full bg-black border border-white/40 p-2 rounded text-white placeholder:text-white/40"
        placeholder="Note (Dinner, Trip...)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* MODE */}
      <div className="flex gap-3 text-sm">
        {(["ME", "SPLIT", "PARTITION"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setSelectedIds([]);
              setCustomAmounts({});
            }}
            className={`border px-3 py-1 rounded ${
              mode === m
                ? "border-white text-white"
                : "border-white/40 text-white/50"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* PEOPLE */}
      {mode !== "ME" && (
        <div className="space-y-2 text-sm">
          {people.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 text-white/80"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={(e) =>
                  setSelectedIds((prev) =>
                    e.target.checked
                      ? [...prev, p.id]
                      : prev.filter((x) => x !== p.id)
                  )
                }
              />
              {p.name}
            </label>
          ))}
        </div>
      )}

      {/* PARTITION */}
      {mode === "PARTITION" &&
        selectedIds.map((id) => {
          const p = people.find((x) => x.id === id);
          return (
            <input
              key={id}
              type="number"
              className="w-full bg-black border border-white/40 p-2 rounded text-white placeholder:text-white/40"
              placeholder={`${p?.name} amount`}
              value={customAmounts[id] || ""}
              onChange={(e) =>
                setCustomAmounts({
                  ...customAmounts,
                  [id]: Number(e.target.value),
                })
              }
            />
          );
        })}

      {/* PREVIEW */}
      <div className="border border-white/40 p-3 rounded">
        <div className="text-sm text-white/60">You Pay</div>
        <div className="text-2xl font-semibold">₹{myAmount}</div>
      </div>

      {/* METHOD */}
      <div className="flex gap-3 text-sm">
        {(["UPI", "CASH"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`border px-3 py-1 rounded ${
              method === m
                ? "border-white text-white"
                : "border-white/40 text-white/50"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* OPEN UPI */}
      {method === "UPI" && (
        <button
          onClick={openUpiApp}
          className="w-full border border-white py-3 rounded text-white"
        >
          Open UPI App
        </button>
      )}

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <button
        onClick={confirmPaid}
        className="w-full border border-white py-3 rounded text-white"
      >
        I Have Paid
      </button>
    </main>
  );
}
