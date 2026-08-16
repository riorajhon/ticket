"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StatusBadge } from "@/components/StatusBadge";
import type { MatchView, PublicUser } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [matchName, setMatchName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  async function load() {
    const me = await fetch("/api/auth");
    if (me.status === 401) {
      await fetch("/api/auth", { method: "DELETE" });
      window.location.href = "/";
      return;
    }
    const meData = await me.json();
    setUser(meData.user);

    const matchRes = await fetch("/api/matches");
    const matchData = await matchRes.json();
    setMatches(matchData.matches ?? []);

    if (meData.user?.isAdmin) {
      const userRes = await fetch("/api/users");
      const userData = await userRes.json();
      setUsers(userData.users ?? []);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMember(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  }

  async function createMatch(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: matchName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create match.");
        return;
      }
      setSelected([]);
      setMatchName("");
      router.push(`/match/${data.match.id}`);
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPasswordMsg(data.error || "Could not update password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMsg("Password updated.");
  }

  async function deleteMatch(id: string) {
    if (!window.confirm("Delete this match for everyone?")) return;
    const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete match.");
      return;
    }
    await load();
  }

  async function deleteUser(id: string) {
    if (!window.confirm(`Delete user ${id}?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete user.");
      return;
    }
    await load();
  }

  const canCreate = matchName.trim().length > 0;
  const createdLabel = useMemo(
    () => new Date().toLocaleString(),
    [],
  );

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/60">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <Nav user={user} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.4fr_0.8fr]">
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">Matches</p>
              <h1 className="font-display text-5xl">All matches</h1>
            </div>
          </div>
          {matches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-8 text-white/50">
              No matches yet. {user.isAdmin
                ? "Create a match on the right. Anyone can join the room."
                : "When an admin creates a match, it will show up here for everyone."}
            </div>
          ) : (
            <div className="grid gap-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-3xl border border-white/10 bg-pitch-900/70 p-5 transition hover:border-turf-500/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/match/${match.id}`} className="min-w-0">
                      <h2 className="font-display text-3xl tracking-wide">
                        {match.name}
                      </h2>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={match.status} />
                      {user.isAdmin && (
                        <button
                          type="button"
                          onClick={() => void deleteMatch(match.id)}
                          className="rounded-full border border-volley-500/40 px-3 py-1 text-xs uppercase tracking-widest text-volley-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <Link href={`/match/${match.id}`}>
                    <p className="mt-2 text-sm text-white/50">
                      {match.pickedCount}/6 picked · {match.members.length} in room · created by{" "}
                      {match.createdBy.displayId}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.members.length === 0 && (
                        <span className="text-xs text-white/40">Open to everyone</span>
                      )}
                      {match.members.map((member) => (
                        <span
                          key={member.id}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs"
                        >
                          {member.displayId}
                        </span>
                      ))}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {user.isAdmin && (
          <aside className="space-y-6">
            <form
              onSubmit={(event) => void createMatch(event)}
              className="rounded-3xl border border-white/10 bg-pitch-900/80 p-5"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">Admin</p>
              <h2 className="font-display text-3xl">Create match</h2>
              <p className="mt-1 text-sm text-white/50">
                Name the room, then create it. Anyone can join. 6 hidden tickets split into Football and Volleyball.
              </p>
              <input
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="Match name"
                maxLength={40}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-turf-500/40 focus:ring-2"
              />
              {error && <p className="mt-3 text-sm text-volley-400">{error}</p>}
              <button
                type="submit"
                disabled={!canCreate || busy}
                className="mt-4 w-full rounded-2xl bg-turf-500 py-3 font-semibold text-pitch-950 disabled:opacity-40"
              >
                {busy ? "Creating…" : "Create match"}
              </button>
              <p className="mt-2 text-[11px] text-white/30">Local time {createdLabel}</p>
            </form>

            <section className="rounded-3xl border border-white/10 bg-pitch-900/80 p-5">
              <h2 className="font-display text-3xl">Users</h2>
              <p className="mt-1 text-sm text-white/50">
                Platform IDs. Admins cannot be deleted.
              </p>
              <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
                {users.length === 0 && (
                  <p className="text-sm text-white/40">No users yet.</p>
                )}
                {users.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2"
                  >
                    <span>
                      {item.displayId}
                      {item.isAdmin && (
                        <span className="ml-2 text-xs text-white/40">admin</span>
                      )}
                    </span>
                    {!item.isAdmin && item.id !== user.id && (
                      <button
                        type="button"
                        onClick={() => void deleteUser(item.id)}
                        className="rounded-full border border-volley-500/40 px-3 py-1 text-xs uppercase tracking-widest text-volley-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <form
              onSubmit={(event) => void updatePassword(event)}
              className="rounded-3xl border border-white/10 bg-pitch-900/80 p-5"
            >
              <h2 className="font-display text-3xl">Update password</h2>
              <div className="mt-3 space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                />
              </div>
              {passwordMsg && (
                <p className="mt-3 text-sm text-turf-400">{passwordMsg}</p>
              )}
              <button
                type="submit"
                className="mt-4 w-full rounded-2xl border border-white/15 py-3 font-semibold"
              >
                Save password
              </button>
            </form>
          </aside>
        )}
      </div>
    </main>
  );
}
