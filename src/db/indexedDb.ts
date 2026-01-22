import { openDB, IDBPDatabase } from "idb";

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb() {
  // ❗ Prevent running on server
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }

  if (!dbPromise) {
    dbPromise = openDB("expense-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("personalExpenses")) {
          db.createObjectStore("personalExpenses", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("splitExpenses")) {
          db.createObjectStore("splitExpenses", { keyPath: "id" });
        }
      },
    });
  }

  return dbPromise;
}
