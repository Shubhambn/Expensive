import { getDb } from "@/db/indexedDb";
import { SplitExpense } from "./types";

export async function addSplitExpense(expense: SplitExpense) {
  const db = await getDb();
  await db.put("splitExpenses", expense);
}

export async function getSplitExpenses(): Promise<SplitExpense[]> {
  const db = await getDb();
  return await db.getAll("splitExpenses");
}
