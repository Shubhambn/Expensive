"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";
import { getPeople } from "@/services/peopleService";

type Mode = "ME" | "SPLIT" | "PARTITION";
type Method = "UPI" | "CASH";

const PAYEE_UPI = process.env.NEXT_PUBLIC_UPI_ID || "";
const PAYEE_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "You";

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

  /* ---------- AUTH ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
    });
    getPeople().then(setPeople);
  }, [router]);

  const total = Number(amount) || 0;

  /* ---------- SPLIT ---------- */
  const participantCount =
    mode === "SPLIT" ? selectedIds.length + 1 : selectedIds.length;

  const splitAmount =
    mode === "SPLIT" && participantCount > 0
      ? Math.floor(total / participantCount)
      : 0;

  /* ---------- PARTITION ---------- */
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

  /* ---------- VALIDATION ---------- */
  function validate() {
    if (total <= 0) return setError("Enter amount"), false;
    if (!note.trim()) return setError("Add a note"), false;
    if (mode !== "ME" && selectedIds.length === 0)
      return setError("Select people"), false;
    if (mode === "PARTITION" && partitionSum > total)
      return setError("Amount mismatch"), false;
    if (!method) return setError("Select payment method"), false;

    setError("");
    return true;
  }

  /* ---------- UPI MESSAGE ---------- */
  const upiMessage = `
Pay ₹${myAmount}
UPI: ${PAYEE_UPI}
Name: ${PAYEE_NAME}
Note: ${note}
`.trim();

  /* ---------- OPEN UPI ---------- */
  function openUpi() {
    if (!validate()) return;

    const params = new URLSearchParams({
      pa: PAYEE_UPI,
      pn: PAYEE_NAME,
      am: myAmount.toString(),
      cu: "INR",
      tn: note,
    });

    window.location.href = `upi://pay?${params.toString()}`;
  }

  /* ---------- CONFIRM ---------- */
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

  /* ---------- UI ---------- */
  return (
    <main className="p-4 max-w-md mx-auto space-y-5 bg-white text-black">
      <h1 className="text-xl font-semibold">Pay</h1>

      {/* AMOUNT */}
      <input
        type="number"
        className="border p-3 w-full rounded"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* NOTE */}
      <input
        className="border p-3 w-full rounded"
        placeholder="Note (Dinner, Rent...)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* MODE */}
      <div className="flex gap-2">
        {(["ME", "SPLIT", "PARTITION"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setSelectedIds([]);
              setCustomAmounts({});
            }}
            className={`flex-1 border p-2 rounded ${
              mode === m ? "bg-black text-white" : ""
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* PEOPLE */}
      {mode !== "ME" && (
        <div className="space-y-2">
          {people.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 border p-2 rounded"
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
              className="border p-2 w-full rounded"
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

      {/* SUMMARY */}
      <div className="border rounded p-3 text-sm space-y-1">
        <div className="font-medium">You pay</div>
        <div className="text-2xl font-semibold">₹{myAmount}</div>
      </div>

      {/* PAYMENT DETAILS */}
      <div className="border rounded p-3 text-xs bg-gray-50">
        <pre className="whitespace-pre-wrap">{upiMessage}</pre>
        <button
          onClick={() => navigator.clipboard.writeText(upiMessage)}
          className="mt-2 border w-full p-2 rounded"
        >
          Copy payment details
        </button>
      </div>

      {/* METHOD */}
      <div className="flex gap-2">
        {(["UPI", "CASH"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`flex-1 border p-2 rounded ${
              method === m ? "bg-black text-white" : ""
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ACTION */}
      {method === "UPI" && (
        <button
          onClick={openUpi}
          className="bg-black text-white w-full p-3 rounded"
        >
          Open UPI App
        </button>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        onClick={confirmPaid}
        className="bg-black text-white w-full p-3 rounded"
      >
        I Have Paid
      </button>
    </main>
  );
}
