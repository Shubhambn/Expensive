import { SplitPerson } from "./types";

export function equalSplit(
  total: number,
  people: Omit<SplitPerson, "amount" | "status">[]
): SplitPerson[] {
  const n = people.length;
  if (n === 0) return [];

  const each = Math.floor((total / n) * 100) / 100;
  let remainder = Math.round((total - each * n) * 100) / 100;

  return people.map((p) => {
    let amount = each;
    if (remainder > 0) {
      amount += 0.01;
      remainder -= 0.01;
    }
    return {
      ...p,
      amount: Number(amount.toFixed(2)),
      status: "PENDING",
    };
  });
}

export function validateCustomSplit(
  total: number,
  people: SplitPerson[]
): { ok: boolean; error?: string } {
  const sum = people.reduce((s, p) => s + p.amount, 0);
  if (Number(sum.toFixed(2)) !== Number(total.toFixed(2))) {
    return { ok: false, error: "Split total does not match expense total" };
  }
  return { ok: true };
}
