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

  /* ---------- AUTH GUARD ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/auth");
    });
  }, [router]);

  /* ---------- LOAD PEOPLE ---------- */
  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getPeople();
      setPeople(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- ADD ---------- */
  async function handleAdd() {
    if (!name.trim()) {
      setError("Name is required");
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
      setError("Name is required");
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
    if (!confirm("Remove this person?")) return;

    try {
      await deletePerson(id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-3">People</h1>

      {/* ADD PERSON */}
      <div className="border p-3 mb-4 rounded">
        <input
          className="border p-2 w-full mb-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {error && (
          <div className="text-red-600 text-sm mb-2">{error}</div>
        )}

        <button
          onClick={handleAdd}
          className="bg-black text-white w-full p-2"
        >
          Add Person
        </button>
      </div>

      {/* LIST */}
      {loading && (
        <div className="text-center text-sm text-gray-500">
          Loading people...
        </div>
      )}

      {!loading && people.length === 0 && (
        <div className="text-gray-500 text-sm text-center">
          No people added yet
        </div>
      )}

      {people.map((p) => (
        <div key={p.id} className="border p-2 mb-2 rounded text-sm">
          {editingId === p.id ? (
            <>
              <input
                className="border p-1 w-full mb-1"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <input
                className="border p-1 w-full mb-2"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="bg-black text-white px-3 py-1 text-xs"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="border px-3 py-1 text-xs"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">{p.name}</div>
              {p.phone && (
                <div className="text-gray-500">{p.phone}</div>
              )}

              <div className="flex gap-4 mt-2 text-xs">
                <button
                  onClick={() => startEdit(p)}
                  className="text-blue-600 underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 underline"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </main>
  );
}
