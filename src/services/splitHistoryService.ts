import { supabase } from "@/db/supabase";

export async function getMySplitHistory() {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      purpose,
      total_amount,
      created_at,
      payment_participants (
        id,
        name,
        phone,
        amount,
        status
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
