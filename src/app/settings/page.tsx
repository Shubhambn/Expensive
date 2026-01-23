"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/db/supabase";

// ✅ Inline validator (no import issues)
function isValidUpi(upi: string) {
  return /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi);
}

export default function SettingsPage() {
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("You");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------- LOAD PROFILE ----------
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("upi_id, upi_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setUpiId(data.upi_id ?? "");
        setUpiName(data.upi_name ?? "You");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  // ---------- SAVE ----------
  async function save() {
    if (!isValidUpi(upiId)) {
      setError("Invalid UPI ID (example: name@bank)");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }

  const { error } = await supabase
  .from("profiles")
  .upsert(
    {
      user_id: user.id,
      upi_id: upiId,
      upi_name: upiName || "You",
    },
    { onConflict: "user_id" }
  );



    if (error) {
      console.error("Save error:", error);
      setError(error.message);
    } else {
      setSuccess("Settings saved successfully");
    }

    setSaving(false);
  }

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading settings…
      </div>
    );
  }

  return (
    <main className="p-4 max-w-md mx-auto space-y-5">
      <h1 className="text-xl font-bold">Payment Settings</h1>

      {/* PROFILE PREVIEW */}
      <div className="border rounded p-3 text-sm bg-gray-50">
        <div className="font-semibold mb-1">Current Profile</div>
        <div>
          Name: <b>{upiName}</b>
        </div>
        <div>
          UPI: <b>{upiId || "Not set"}</b>
        </div>
      </div>

      {/* FORM */}
      <div>
        <label className="text-sm font-semibold">UPI Display Name</label>
        <input
          className="border p-2 w-full mt-1"
          placeholder="Your name"
          value={upiName}
          onChange={(e) => setUpiName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Your UPI ID</label>
        <input
          className="border p-2 w-full mt-1"
          placeholder="yourupi@bank"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}

      <button
        onClick={save}
        disabled={saving}
        className="bg-black text-white w-full p-3 rounded"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </main>
  );
}
