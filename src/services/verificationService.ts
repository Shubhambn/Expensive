import { supabase } from "@/db/supabase";
import { CsvRow } from "@/utils/csvParser";

export interface VerificationResult {
  matched: number;
  failed: number;
  duplicates: number;
}

export async function verifyPayments(
  rows: CsvRow[]
): Promise<VerificationResult> {
  let matched = 0;
  let failed = 0;
  let duplicates = 0;

  for (const row of rows) {
    const { utr, amount } = row;

    const { data, error } = await supabase
      .from("payment_participants")
      .select("id, amount, status")
      .eq("payment_utr", utr)
      .maybeSingle();

    if (error) continue;

    if (!data) {
      failed++;
      continue;
    }

    if (data.status === "VERIFIED") {
      duplicates++;
      continue;
    }

    if (Number(data.amount) !== Number(amount)) {
      await supabase
        .from("payment_participants")
        .update({ status: "FALSE" })
        .eq("id", data.id);

      failed++;
      continue;
    }

    await supabase
      .from("payment_participants")
      .update({ status: "VERIFIED" })
      .eq("id", data.id);

    matched++;
  }

  return { matched, failed, duplicates };
}
