"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPeople } from "@/services/peopleService";
import { createPaymentRequest } from "@/services/paymentRequestService";
import { PAYEE } from "../../../../public/config/Mvp";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const MY_UPI_ID = PAYEE.upiId || "";
const MY_UPI_NAME = PAYEE.name || "You";

/* ---------- UI HELPERS ---------- */
const activeBtn =
  "border-red-500 text-red-500 font-semibold";

const inactiveBtn =
  "border-white/40 text-white/60 hover:text-white";

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
      setPeople(
        all.filter((p) => parsed.selectedIds.includes(p.id))
      );
    });
  }, [router]);

  if (!intent) return null;

  const date = new Date(intent.createdAt).toLocaleString();

  /* ---------- SEND WHATSAPP ---------- */
  async function sendWhatsApp(p: any, amount: number) {
    if (sentIds.has(p.id)) return;

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
      alert("Failed to create payment link");
    } finally {
      setSendingId(null);
    }
  }

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-black p-4 max-w-md mx-auto space-y-5 text-white">
      <h1 className="text-xl font-bold text-red-500">
        Confirm Payment
      </h1>

      {/* SUMMARY */}
      <div className="border border-white/40 rounded p-3 text-sm space-y-1">
        <div className="font-semibold text-white">
          {intent.note}
        </div>
        <div className="text-white/70">
          Total Paid: ₹{intent.amount}
        </div>
        <div className="text-xs text-white/40">
          {date}
        </div>
      </div>

      {/* STEP 1 — CONFIRM */}
      {!confirmed && (
        <div className="space-y-2">
          <button
            onClick={() => setConfirmed(true)}
            className="w-full border border-red-500 text-red-500 py-3 rounded font-semibold"
          >
            Yes, I Paid
          </button>

          <button
            onClick={() => router.push("/pay")}
            className="w-full border border-white/40 text-white/60 py-3 rounded"
          >
            Go Back
          </button>
        </div>
      )}

      {/* STEP 2 — SEND LINKS */}
      {confirmed && (
        <>
          <input
            className="w-full bg-black border border-white/40 p-2 rounded text-white"
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
                  className={`w-full border p-3 text-left rounded transition ${
                    sent
                      ? "border-red-500 text-red-500"
                      : "border-white/40 text-white/70 hover:text-white"
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
              className="w-full border border-white/40 text-white py-3 rounded mt-4"
            >
              Done
            </button>
          )}
        </>
      )}
    </main>
  );
}
