"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useRouter } from "next/navigation";

import { createSplit } from "@/services/splitService";
import { equalSplit, validateCustomSplit } from "@/features/split/splitUtils";
import { buildWhatsAppMessage, openWhatsApp } from "@/utils/whatsapp";
import { SplitPerson, PaymentStatus } from "@/features/split/types";
import { supabase } from "@/db/supabase";

export default function SplitPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [createdTitle, setCreatedTitle] = useState("");
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState<SplitPerson[]>([]);
  const [createdPeople, setCreatedPeople] = useState<SplitPerson[]>([]);
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
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

  // ---------- ADD PERSON ----------
  const addPerson = () => {
    setPeople((prev) => [
      ...prev,
      {
        id: uuid(),
        name: "",
        phone: "",
        amount: 0,
        status: "PENDING" as PaymentStatus,
      },
    ]);
  };

  // ---------- EQUAL SPLIT ----------
  const applyEqualSplit = () => {
    if (!total || people.length === 0) return;

    const result = equalSplit(
      Number(total),
      people.map(({ id, name, phone }) => ({ id, name, phone }))
    );

    setPeople(result);
  };

  // ---------- CREATE SPLIT ----------
  const saveSplit = async () => {
    if (creating) return;

    if (!title || !total) {
      setError("Title and total amount are required");
      return;
    }

    if (people.length === 0) {
      setError("Add at least one person");
      return;
    }

    const check = validateCustomSplit(Number(total), people);
    if (!check.ok) {
      setError(check.error!);
      return;
    }

    setError("");
    setCreating(true);

    const id = await createSplit({
      totalAmount: Number(total),
      purpose: title.trim(),
      participants: people.map((p) => ({
        name: p.name.trim(),
        phone: p.phone.trim(),
        amount: p.amount,
      })),
    });

    setCreatedPeople(people);
    setCreatedTitle(title.trim());
    setPaymentId(id);

    // reset form
    setTitle("");
    setTotal("");
    setPeople([]);
    setCreating(false);
  };

  if (checkingAuth) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Checking session...
      </div>
    );
  }

  const paymentLink =
    paymentId && typeof window !== "undefined"
      ? `${window.location.origin}/pay/${paymentId}`
      : "";

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-3">Split Expense</h1>

      {/* -------- CREATE SPLIT -------- */}
      <input
        className="border p-2 w-full mb-2"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={creating}
      />

      <input
        type="number"
        className="border p-2 w-full mb-2"
        placeholder="Total amount"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        disabled={creating}
      />

      <button
        onClick={addPerson}
        className="border p-2 w-full mb-2"
        disabled={creating}
      >
        + Add Person
      </button>

      {people.map((p, idx) => (
        <div key={p.id} className="border p-2 mb-2">
          <input
            className="border p-1 w-full mb-1"
            placeholder="Name"
            value={p.name}
            onChange={(e) => {
              const v = e.target.value;
              setPeople((arr) =>
                arr.map((x, i) => (i === idx ? { ...x, name: v } : x))
              );
            }}
            disabled={creating}
          />
          <input
            className="border p-1 w-full mb-1"
            placeholder="Phone"
            value={p.phone}
            onChange={(e) => {
              const v = e.target.value;
              setPeople((arr) =>
                arr.map((x, i) => (i === idx ? { ...x, phone: v } : x))
              );
            }}
            disabled={creating}
          />
          <input
            type="number"
            className="border p-1 w-full"
            placeholder="Amount (0 = equal)"
            value={p.amount}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPeople((arr) =>
                arr.map((x, i) => (i === idx ? { ...x, amount: v } : x))
              );
            }}
            disabled={creating}
          />
        </div>
      ))}

      <button
        onClick={applyEqualSplit}
        className="bg-gray-200 p-2 w-full mb-2"
        disabled={creating}
      >
        Equal Split
      </button>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      <button
        onClick={saveSplit}
        disabled={creating}
        className="bg-black text-white p-2 w-full disabled:opacity-60"
      >
        {creating ? "Creating..." : "Create Split"}
      </button>

      {/* -------- SHARE PAYMENT LINK -------- */}
      {paymentId && (
        <div className="border p-3 mt-4 text-sm">
          <div className="font-semibold mb-2">
            Split created successfully 🎉
          </div>

          <div className="break-all text-blue-600 mb-3">
            {paymentLink}
          </div>

          {createdPeople.map((p) => (
            <button
              key={p.id}
              className="block text-green-600 underline mb-1"
              onClick={() => {
                const msg = buildWhatsAppMessage({
                  payerName: p.name,
                  amount: p.amount,
                  purpose: createdTitle,
                  paymentLink,
                });
                openWhatsApp(p.phone, msg);
              }}
            >
              Send WhatsApp to {p.name}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
