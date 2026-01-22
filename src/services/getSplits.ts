import { supabase } from "@/db/supabase";

export async function getMySplits() {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      total_amount,
      purpose,
      created_at,
      payment_participants (
        id,
        name,
        phone,
        amount,
        status,
        payment_method
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
