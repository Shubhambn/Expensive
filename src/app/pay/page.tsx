"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";
import { getPeople } from "@/services/peopleService";
import { generateUpiLink } from "@/utils/upi";

type Mode = "ME" | "SPLIT" | "PARTITION";
type Method = "UPI" | "CASH" | "ATM";
type UpiApp = "ANY" | "GPAY" | "PHONEPE" | "PAYTM";

export default function PayPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<Mode>("ME");

  const [method, setMethod] = useState<Method | null>(null);
  const [upiApp, setUpiApp] = useState<UpiApp | null>(null);

  const [people, setPeople] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  /* ---------- AUTH + LOAD ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
    });
    getPeople().then(setPeople);
  }, [router]);

  const total = Number(amount) || 0;

  /* ---------- SPLIT CALC ---------- */
  const participantCount =
    mode === "SPLIT" ? selectedIds.length + 1 : selectedIds.length;

  const splitAmount =
    mode === "SPLIT" && participantCount > 0
      ? Math.floor(total / participantCount)
      : 0;

  /* ---------- PARTITION CALC ---------- */
  const partitionSum = useMemo(
    () =>
      Object.values(customAmounts).reduce(
        (sum, v) => sum + (v || 0),
        0
      ),
    [customAmounts]
  );

  const myAmount =
    mode === "ME"
      ? total
      : mode === "SPLIT"
      ? splitAmount
      : Math.max(total - partitionSum, 0);

  /* ---------- VALIDATION ---------- */
  function validateBeforePay() {
    if (total <= 0) return setError("Enter valid amount"), false;
    if (!note.trim()) return setError("Note is required"), false;
    if (mode !== "ME" && selectedIds.length === 0)
      return setError("Select at least one person"), false;
    if (mode === "PARTITION" && partitionSum > total)
      return setError("Partition exceeds total amount"), false;
    if (!method) return setError("Select payment method"), false;
    if (method === "UPI" && !upiApp)
      return setError("Select UPI app"), false;

    setError("");
    return true;
  }

  /* ---------- ACTIONS ---------- */
  function openUpi() {
    if (!validateBeforePay()) return;

    const link = generateUpiLink({
      app: upiApp!,
      payeeUpiId: "yourupi@bank",
      payeeName: "You",
      amount: myAmount,
      note: `${note} • ${new Date().toLocaleString()}`,
    });

    window.location.href = link;
  }

  function confirmPaid() {
    if (!validateBeforePay()) return;

    sessionStorage.setItem(
      "payment_intent",
      JSON.stringify({
        amount: total,
        note,
        mode,
        method,
        upiApp,
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
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">Pay</h1>

      {/* AMOUNT */}
      <input
        type="number"
        className="border p-2 w-full"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* NOTE */}
      <input
        type="text"
        className="border p-2 w-full"
        placeholder="Note (Dinner, Trip...)"
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
            className={`px-3 py-1 rounded border ${
              mode === m ? "bg-red-600 text-white" : "border-gray-300"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* PEOPLE */}
      {mode !== "ME" &&
        people.map((p) => (
          <label key={p.id} className="flex gap-2 text-sm">
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

      {/* PARTITION INPUTS */}
      {mode === "PARTITION" &&
        selectedIds.map((id) => {
          const p = people.find((x) => x.id === id);
          return (
            <input
              key={id}
              type="number"
              className="border p-2 w-full"
              placeholder={`${p.name} amount`}
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
      <div className="border p-3 text-sm space-y-1">
        <div className="font-semibold">Preview</div>

        <div className="flex justify-between">
          <span>You</span>
          <span>₹{myAmount}</span>
        </div>

        {mode !== "ME" &&
          selectedIds.map((id) => {
            const p = people.find((x) => x.id === id);
            const amt =
              mode === "SPLIT"
                ? splitAmount
                : customAmounts[id] || 0;

            return (
              <div
                key={id}
                className="flex justify-between text-gray-700"
              >
                <span>{p.name}</span>
                <span>₹{amt}</span>
              </div>
            );
          })}

        <div className="border-t pt-1 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* METHOD */}
      <div className="flex gap-2">
        {(["UPI", "CASH", "ATM"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMethod(m);
              setUpiApp(null);
            }}
            className={`px-3 py-1 rounded border ${
              method === m ? "bg-red-600 text-white" : "border-gray-300"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* UPI APPS */}
      {method === "UPI" && (
        <div className="grid grid-cols-2 gap-2">
          {(["ANY", "GPAY", "PHONEPE", "PAYTM"] as UpiApp[]).map((a) => (
            <button
              key={a}
              onClick={() => setUpiApp(a)}
              className={`border p-2 rounded ${
                upiApp === a ? "bg-red-600 text-white" : ""
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {method === "UPI" && (
        <button
          onClick={openUpi}
          className="bg-gray-800 text-white w-full p-3 rounded"
        >
          Open Payment App
        </button>
      )}

      <button
        onClick={confirmPaid}
        className="bg-black text-white w-full p-3 rounded"
      >
        I Have Paid
      </button>
    </main>
  );
}
