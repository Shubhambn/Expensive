"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseCSV } from "@/utils/csvParser";
import { verifyPayments } from "@/services/verificationService";
import { supabase } from "@/db/supabase";

export default function VerifyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ---------- AUTH ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/auth");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  async function handleFile(file: File) {
    setError("");
    setMessage("");

    if (!file.name.endsWith(".csv")) {
      setError("Upload a valid CSV file");
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const result = await verifyPayments(rows);

      setMessage(
        `Verification completed

Matched: ${result.matched}
Failed: ${result.failed}
Duplicates: ${result.duplicates}`
      );
    } catch (e: any) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        Checking session...
      </div>
    );
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-3">Verify Payments</h1>

      <p className="text-sm text-gray-600 mb-3">
        Upload your bank CSV to verify UPI / ATM / cash entries.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={(e) =>
          e.target.files && handleFile(e.target.files[0])
        }
      />

      {loading && (
        <div className="text-sm mt-2">
          Verifying payments...
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm mt-2">
          {error}
        </div>
      )}

      {message && (
        <div className="text-green-600 text-sm mt-2 whitespace-pre-line">
          {message}
        </div>
      )}
    </main>
  );
}
