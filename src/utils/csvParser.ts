export interface CsvRow {
  utr: string;
  amount: number;
  date: string;
}

export function parseCSV(text: string): CsvRow[] {
  const lines = text.split("\n").slice(1);

  return lines
    .map((l) => l.split(","))
    .filter((cols) => cols.length >= 3)
    .map((cols) => ({
      utr: cols[0]?.trim().toUpperCase(),
      amount: Number(cols[1]),
      date: cols[2],
    }))
    .filter((r) => r.utr && r.amount);
}
