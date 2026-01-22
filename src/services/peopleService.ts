import { supabase } from "@/db/supabase";

export async function getPeople() {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addPerson(name: string, phone?: string) {
  const { data, error } = await supabase
    .from("people")
    .insert({ name, phone })
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deletePerson(id: string) {
  const { error } = await supabase
    .from("people")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
