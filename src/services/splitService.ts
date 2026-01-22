import { supabase } from "@/db/supabase";

export async function createSplit({
  totalAmount,
  purpose,
  participants,
}: {
  totalAmount: number;
  purpose: string;
  participants: {
    name: string;
    phone: string;
    amount: number;
  }[];
}) {
  // 1️⃣ Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      total_amount: totalAmount,
      purpose,
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // 2️⃣ Insert participants
  const participantRows = participants.map((p) => ({
    payment_id: payment.id,
    name: p.name,
    phone: p.phone,
    amount: p.amount,
    payment_method: "UPI",
    status: "PENDING",
  }));

  const { error: participantError } = await supabase
    .from("payment_participants")
    .insert(participantRows);

  if (participantError) throw participantError;

  return payment.id; // payment_request_id
}
