"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- REDIRECT IF ALREADY LOGGED IN ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/");
      }
    });
  }, [router]);

  // ---------- VALIDATION ----------
  const validate = () => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const normalizedEmail = email.trim().toLowerCase();

  // ---------- SIGN UP ----------
  const signUp = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      alert(
        "Account created successfully. Please log in using your credentials."
      );
    }
  };

  // ---------- SIGN IN ----------
  const signIn = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">
        Login / Sign Up
      </h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <input
        type="password"
        className="border p-2 w-full mb-3"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      {error && (
        <div className="text-red-600 mb-2 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={signIn}
        disabled={loading}
        className="bg-black text-white w-full p-2 mb-2 disabled:opacity-60"
      >
        {loading ? "Please wait..." : "Login"}
      </button>

      <button
        onClick={signUp}
        disabled={loading}
        className="border w-full p-2 disabled:opacity-60"
      >
        Create Account
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        One account lets you manage expenses, splits, and payments securely.
      </p>
    </main>
  );
}
