import { create } from "zustand";

import { PersonalExpense } from "@/features/personal/types";
import {
  addPersonalExpense,
  getPersonalExpenses,
} from "@/features/personal/personalDb";
import { SplitExpense, PaymentStatus } from "@/features/split/types";

import {
  addSplitExpense,
  getSplitExpenses,
} from "@/features/split/splitDb";

interface ExpenseState {
  personalExpenses: PersonalExpense[];
  splitExpenses: SplitExpense[];

  loadPersonalExpenses: () => Promise<void>;
  addExpense: (expense: PersonalExpense) => Promise<void>;

  loadSplitExpenses: () => Promise<void>;
  addSplit: (expense: SplitExpense) => Promise<void>;

  markPersonPaid: (
    splitId: string,
    personId: string,
    utr?: string
  ) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  personalExpenses: [],
  splitExpenses: [],

  // ---------- PERSONAL ----------
  loadPersonalExpenses: async () => {
    const data = await getPersonalExpenses();
    set({ personalExpenses: data });
  },

  addExpense: async (expense) => {
    await addPersonalExpense(expense);
    set((state) => ({
      personalExpenses: [...state.personalExpenses, expense],
    }));
  },

  // ---------- SPLIT ----------
  loadSplitExpenses: async () => {
    const data = await getSplitExpenses();
    set({ splitExpenses: data });
  },

  addSplit: async (expense) => {
    await addSplitExpense(expense);
    set((state) => ({
      splitExpenses: [...state.splitExpenses, expense],
    }));
  },

  // ---------- MARK PAID ----------
  markPersonPaid: async (splitId, personId, utr) => {
    const updatedSplits = get().splitExpenses.map((split) => {
      if (split.id !== splitId) return split;

      return {
        ...split,
        people: split.people.map((p) =>
          p.id === personId
            ? {
                ...p,
                status: "PAID_UNVERIFIED" as PaymentStatus,
                utr,
              }
            : p
        ),
      };
    });

    // persist each updated split
    for (const split of updatedSplits) {
      await addSplitExpense(split);
    }

    set({ splitExpenses: updatedSplits });
  },
}));
