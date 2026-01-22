// src/features/personal/personalDb.ts
import { getDb } from "@/db/indexedDb";
import { PersonalExpense } from "./types";

export async function addPersonalExpense(expense: PersonalExpense) {
  const db = await getDb();
  await db.put("personalExpenses", expense);
}

export async function getPersonalExpenses(): Promise<PersonalExpense[]> {
  const db = await getDb();
  return await db.getAll("personalExpenses");
}

