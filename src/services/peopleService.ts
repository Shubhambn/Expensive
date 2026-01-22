import { supabase } from "@/db/supabase";

/* ---------------- GET PEOPLE ---------------- */
export async function getPeople() {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/* ---------------- ADD PERSON ---------------- */
export async function addPerson(name: string, phone?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("people").insert({
    name,
    phone,
    owner_user_id: user.id, // ✅ REQUIRED
  });

  if (error) throw error;
}

/* ---------------- UPDATE PERSON ---------------- */
export async function updatePerson(
  id: string,
  name: string,
  phone?: string
) {
  const { error } = await supabase
    .from("people")
    .update({ name, phone })
    .eq("id", id);

  if (error) throw error;
}

/* ---------------- DELETE PERSON ---------------- */
export async function deletePerson(id: string) {
  const { error } = await supabase
    .from("people")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
