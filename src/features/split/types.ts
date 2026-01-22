// src/features/split/types.ts
export type PaymentStatus =
  | "PENDING"
  | "PAID_UNVERIFIED"
  | "VERIFIED"
  | "FALSE";


export interface SplitPerson {
  id: string;
  name: string;
  phone: string;
  amount: number;
  status: PaymentStatus;
  utr?: string;
}

export interface SplitExpense {
  id: string;
  title: string;
  totalAmount: number;
  date: string;
  people: SplitPerson[];
}

export interface VerificationResult {
  matched: number;
  failed: number;
  duplicates: number;
}
