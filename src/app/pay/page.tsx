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

  /* ---------- CALCULATIONS ---------- */
  const participantCount =
    mode === "SPLIT" ? selectedIds.length + 1 : selectedIds.length;

  const splitAmount =
    mode === "SPLIT" && participantCount > 0
      ? Math.floor(total / participantCount)
      : 0;

  const partitionSum = useMemo(
    () => Object.values(customAmounts).reduce((s, x) => s + (x || 0), 0),
    [customAmounts]
  );

  const myAmount =
    mode === "ME"
      ? total
      : mode === "SPLIT"
      ? splitAmount
      : total - partitionSum;

  /* ---------- VALIDATION ---------- */
  function validate() {
    if (total <= 0) return setError("Enter a valid amount"), false;
    if (mode !== "ME" && selectedIds.length === 0)
      return setError("Select at least one person"), false;
    if (mode === "PARTITION" && partitionSum > total)
      return setError("Partition exceeds total"), false;
    if (!method) return setError("Select payment method"), false;
    if (method === "UPI" && !upiApp)
      return setError("Select UPI app"), false;

    setError("");
    return true;
  }

  /* ---------- PROCEED ---------- */
  function proceedToPay() {
    if (!validate()) return;

    sessionStorage.setItem(
      "pending_payment",
      JSON.stringify({
        total,
        mode,
        method,
        upiApp,
        selectedIds,
        splitAmount,
        customAmounts,
        myAmount,
      })
    );

    if (method === "UPI") {
      const link = generateUpiLink({
        app: upiApp!,
        payeeUpiId: "yourupi@bank",
        payeeName: "You",
        amount: myAmount,
        note: `Payment • ${new Date().toLocaleString()}`,
      });

      window.location.href = link;
    } else {
      router.push("/pay/confirm");
    }
  }

  /* ---------- UI ---------- */
  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">Pay</h1>

      {/* AMOUNT */}
      <section>
        <div className="text-sm font-semibold mb-1">Total Amount</div>
        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </section>

      {/* PAYMENT TYPE */}
      <section>
        <div className="text-sm font-semibold mb-1">Payment Type</div>
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
                mode === m
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* PEOPLE */}
      {mode !== "ME" && (
        <section>
          <div className="text-sm font-semibold mb-1">Select People</div>
          {people.map((p) => (
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
        </section>
      )}

      {/* PARTITION INPUT */}
      {mode === "PARTITION" &&
        selectedIds.map((id) => {
          const p = people.find((x) => x.id === id);
          return (
            <input
              key={id}
              type="number"
              className="border p-2 w-full"
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
      <section className="border p-3 text-sm">
        <div className="font-semibold mb-2">Payment Summary</div>

        <div className="flex justify-between font-semibold">
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
              <div key={id} className="flex justify-between">
                <span>{p.name}</span>
                <span>₹{amt}</span>
              </div>
            );
          })}

        <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </section>

      {/* PAYMENT METHOD */}
      <section>
        <div className="text-sm font-semibold mb-1">Payment Method</div>
        <div className="flex gap-2">
          {(["UPI", "CASH", "ATM"] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMethod(m);
                setUpiApp(null);
              }}
              className={`px-3 py-1 rounded border ${
                method === m
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* UPI APP */}
      {method === "UPI" && (
        <section className="border p-2 text-sm">
          <div className="font-semibold mb-2">Choose UPI App</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["ANY", "Any UPI"],
              ["GPAY", "Google Pay"],
              ["PHONEPE", "PhonePe"],
              ["PAYTM", "Paytm"],
            ] as [UpiApp, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setUpiApp(k)}
                className={`p-2 rounded border ${
                  upiApp === k
                    ? "bg-red-600 text-white border-red-600"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        onClick={proceedToPay}
        className="bg-black text-white w-full p-3 rounded"
      >
        Proceed to Pay
      </button>
    </main>
  );
}
