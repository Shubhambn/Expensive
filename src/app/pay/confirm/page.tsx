// src/app/pay/confirm/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPeople } from "@/services/peopleService";
import { createPaymentRequest } from "@/services/paymentRequestService";
import { PAYEE } from "../../../../public/config/Mvp";

/* ========= MVP PAYEE (ENV ONLY) ========= */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MY_UPI_ID = PAYEE.upiId || "";
const MY_UPI_NAME = PAYEE.name|| "You";

export default function ConfirmPage() {
  const router = useRouter();

  const [intent, setIntent] = useState<any>(null);
  const [utr, setUtr] = useState("");
  const [people, setPeople] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  /* ---------- LOAD INTENT ---------- */
  useEffect(() => {
    const raw = sessionStorage.getItem("payment_intent");
    if (!raw) {
      router.replace("/pay");
      return;
    }

    const parsed = JSON.parse(raw);
    setIntent(parsed);

    getPeople().then((all) => {
      setPeople(all.filter((p) => parsed.selectedIds.includes(p.id)));
    });
  }, [router]);

  if (!intent) return null;

  const date = new Date(intent.createdAt).toLocaleString();

  /* ---------- SEND WHATSAPP ---------- */
  async function sendWhatsApp(p: any, amount: number) {
    if (sentIds.has(p.id)) return;

    if (!MY_UPI_ID) {
      alert("UPI ID not configured. Check .env");
      return;
    }

    setSendingId(p.id);

    try {
      const requestId = await createPaymentRequest({
        personId: p.id,
        personName: p.name,
        personPhone: p.phone,
        amount,
        note: intent.note,
        payeeUpiId: MY_UPI_ID,
        payeeName: MY_UPI_NAME,
      });

      const link = `${APP_URL}/pay/collect/${requestId}`;

      const message = `
${intent.note} • ${date}

Amount: ₹${amount}
${utr ? `Reference: ${utr}\n` : ""}
Pay here:
${link}
      `.trim();

      window.open(
        `https://wa.me/${p.phone}?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      setSentIds((prev) => new Set(prev).add(p.id));
    } catch (err) {
      console.error("createPaymentRequest failed:", err);
      alert("Failed to create payment link. Check console.");
    } finally {
      setSendingId(null);
    }
  }

  /* ---------- UI ---------- */
  return (
    <main className="p-4 max-w-md mx-auto space-y-4 bg-white">
      <h1 className="text-xl font-semibold">Confirm Payment</h1>

      {/* SUMMARY */}
      <div className="border rounded p-3 text-sm">
        <div className="font-medium">{intent.note}</div>
        <div>Total Paid: ₹{intent.amount}</div>
        <div className="text-xs text-gray-500">{date}</div>
      </div>

      {!confirmed && (
        <div className="space-y-2">
          <button
            onClick={() => setConfirmed(true)}
            className="bg-black text-white w-full p-3 rounded"
          >
            Yes, I Paid
          </button>

          <button
            onClick={() => router.push("/pay")}
            className="border w-full p-3 rounded"
          >
            Go Back
          </button>
        </div>
      )}

      {confirmed && (
        <>
          <input
            className="border p-2 w-full rounded"
            placeholder="UTR / Reference (optional)"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
          />

          <div className="space-y-2">
            {people.map((p) => {
              const amount =
                intent.mode === "SPLIT"
                  ? intent.splitAmount
                  : intent.customAmounts?.[p.id] || 0;

              const sent = sentIds.has(p.id);

              return (
                <button
                  key={p.id}
                  disabled={sent || sendingId === p.id}
                  onClick={() => sendWhatsApp(p, amount)}
                  className={`border w-full p-3 text-left rounded ${
                    sent
                      ? "bg-green-50 text-green-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {sent
                    ? `Sent to ${p.name} ✓`
                    : sendingId === p.id
                    ? "Sending..."
                    : `Send to ${p.name} — ₹${amount}`}
                </button>
              );
            })}
          </div>

          {sentIds.size === people.length && (
            <button
              onClick={() => router.push("/")}
              className="bg-black text-white w-full p-3 rounded mt-4"
            >
              Done
            </button>
          )}
        </>
      )}
    </main>
  );
}
