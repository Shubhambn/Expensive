// src/app/people/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db/supabase";
import {
  getPeople,
  addPerson,
  updatePerson,
  deletePerson,
} from "@/services/peopleService";

export default function PeoplePage() {
  const router = useRouter();

  const [people, setPeople] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  /* ---------- AUTH ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
    });
  }, [router]);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setPeople(await getPeople());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- ADD ---------- */
  async function handleAdd() {
    if (!name.trim()) {
      setError("NAME_REQUIRED");
      return;
    }

    try {
      setError("");
      await addPerson(name.trim(), phone.trim());
      setName("");
      setPhone("");
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  /* ---------- EDIT ---------- */
  function startEdit(p: any) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPhone(p.phone || "");
  }

  async function saveEdit() {
    if (!editName.trim()) {
      setError("NAME_REQUIRED");
      return;
    }

    try {
      await updatePerson(editingId!, editName.trim(), editPhone.trim());
      setEditingId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  /* ---------- DELETE ---------- */
  async function handleDelete(id: string) {
    if (!confirm("DELETE_THIS_PERSON?")) return;
    await deletePerson(id);
    load();
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 max-w-md mx-auto space-y-5 font-mono">
      {/* HEADER */}
      <div className="border border-white/30 p-3 flex justify-between items-center">
        <h1 className="text-lg tracking-wide">
          PEOPLE<span className="text-red-500">_</span>
        </h1>
        <button
          onClick={() => router.push("/")}
          className="text-xs text-white/60 hover:text-white"
        >
          BACK
        </button>
      </div>

      {/* ADD PERSON */}
      <div className="border border-white/30 p-4 space-y-3">
        <div className="text-xs text-white/60 tracking-widest">
          ADD_PLAYER
        </div>

        <input
          className="w-full bg-black border border-white/40 p-2 rounded text-white placeholder:text-white/40"
          placeholder="NAME"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full bg-black border border-white/40 p-2 rounded text-white placeholder:text-white/40"
          placeholder="PHONE (OPTIONAL)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {error && (
          <div className="text-red-400 text-xs">
            ERROR: {error}
          </div>
        )}

        <button
          onClick={handleAdd}
          className="w-full border border-white py-2 hover:bg-white hover:text-black transition"
        >
          ADD
        </button>
      </div>

      {/* LIST */}
      {loading && (
        <div className="text-center text-xs text-white/40">
          LOADING_PLAYERS…
        </div>
      )}

      {!loading && people.length === 0 && (
        <div className="text-center text-xs text-white/40">
          NO_PLAYERS_FOUND
        </div>
      )}

      <div className="space-y-3">
        {people.map((p) => (
          <div
            key={p.id}
            className="border border-white/30 p-3 text-sm"
          >
            {editingId === p.id ? (
              <>
                <input
                  className="w-full bg-black border border-white/40 p-1 mb-2 text-white"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  className="w-full bg-black border border-white/40 p-1 mb-3 text-white"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />

                <div className="flex gap-3 text-xs">
                  <button
                    onClick={saveEdit}
                    className="border border-white px-3 py-1 hover:bg-white hover:text-black"
                  >
                    SAVE
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="border border-white/40 px-3 py-1 text-white/60"
                  >
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold tracking-wide">
                  {p.name}
                </div>

                {p.phone && (
                  <div className="text-xs text-white/60">
                    {p.phone}
                  </div>
                )}

                <div className="flex gap-4 mt-3 text-xs">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-white/70 hover:text-white"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    DELETE
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
