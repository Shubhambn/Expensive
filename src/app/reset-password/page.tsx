"use client";

import { useState } from "react";
import { supabase } from "@/db/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      alert("Password updated successfully");
      router.push("/");
    }
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Reset Password
      </h1>

      <input
        type="password"
        className="border p-2 w-full mb-3"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <div className="text-red-600 text-sm mb-2">
          {error}
        </div>
      )}

      <button
        onClick={updatePassword}
        disabled={loading}
        className="bg-black text-white w-full p-2"
      >
        Update Password
      </button>
    </main>
  );
}
