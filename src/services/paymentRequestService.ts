import { supabase } from "@/db/supabase";

type CreatePaymentRequestInput = {
  personId?: string;
  personName: string;
  personPhone?: string;
  amount: number;
  note: string;
  payeeUpiId: string;
  payeeName: string;
};

export async function createPaymentRequest(
  input: CreatePaymentRequestInput
): Promise<string> {
  // ---------- AUTH ----------
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // ---------- VALIDATION ----------
  if (!input.personName.trim()) {
    throw new Error("Person name is required");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("Invalid amount");
  }

  if (!input.note.trim()) {
    throw new Error("Payment note is required");
  }

  if (!input.payeeUpiId.trim()) {
    throw new Error("Payee UPI ID is required");
  }

  // ---------- INSERT ----------
  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      owner_user_id: user.id,

      person_id: input.personId ?? null,
      person_name: input.personName,
      person_phone: input.personPhone ?? null,

      amount: input.amount,
      note: input.note,

      payee_upi_id: input.payeeUpiId,
      payee_name: input.payeeName,

      status: "PENDING",          // 🔑 important
      created_at: new Date().toISOString(),
    })
    .select("id")
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error("createPaymentRequest error:", error);
    throw new Error("Failed to create payment request");
  }

  return data[0].id;
}
