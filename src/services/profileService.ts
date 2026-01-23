// src/services/profileService.ts
import { supabase } from "@/db/supabase";

export async function getMyUpiProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("upi_id, upi_name")
    .single();

  if (error || !data?.upi_id) {
    throw new Error("UPI not set in profile");
  }

  return {
    upiId: data.upi_id,
    displayName: data.upi_name || "You",
  };
}
