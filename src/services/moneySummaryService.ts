import { supabase } from "@/db/supabase";

export async function getIncomingOutgoing() {
  const { data, error } = await supabase
    .from("payment_participants")
    .select(`
      id,
      name,
      amount,
      status,
      payment:payment_id (
        purpose,
        created_by
      )
    `);

  if (error) throw error;

  const userId = (await supabase.auth.getUser()).data.user?.id;

  const incoming: any[] = [];
  const outgoing: any[] = [];

  data?.forEach((p: any) => {
    if (p.payment.created_by === userId) {
      // others owe you
      if (p.status !== "VERIFIED") {
        incoming.push(p);
      }
    } else {
      // you owe others
      if (p.status !== "VERIFIED") {
        outgoing.push(p);
      }
    }
  });

  return { incoming, outgoing };
}
