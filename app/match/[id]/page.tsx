"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StatusBadge } from "@/components/StatusBadge";
import { TicketCard } from "@/components/TicketCard";
import { FootballIcon, VolleyballIcon } from "@/components/Icons";
import type { MatchView, PublicUser } from "@/lib/types";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [match, setMatch] = useState<MatchView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadUser() {
    const res = await fetch("/api/auth");
    if (res.status === 401) {
      await fetch("/api/auth", { method: "DELETE" });
      window.location.href = "/";
      return;
    }
    const data = await res.json();
    setUser(data.user);
  }

  async function loadMatch() {
    const res = await fetch(`/api/matches/${params.id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not open match.");
      return;
    }
    setMatch(data.match);
    setError("");
  }

  useEffect(() => {
    void loadUser();
  }, []);

  useEffect(() => {
    if (!params.id) return;
    void loadMatch();
    const timer = window.setInterval(() => void loadMatch(), 1000);
    return () => window.clearInterval(timer);
  }, [params.id]);

  async function startMatch() {
    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${params.id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start.");
        return;
      }
      await loadMatch();
    } finally {
      setBusy(false);
    }
  }

  async function pickCard(position: number) {
    if (!match || match.status !== "active" || match.myPick !== null) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${params.id}/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not pick that card.");
        return;
      }
      await loadMatch();
    } finally {
      setBusy(false);
    }
  }

  if (!user || (!match && !error)) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/60">
        Loading match…
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen">
        {user && <Nav user={user} />}
        <p className="p-8 text-volley-400">{error}</p>
      </main>
    );
  }

  const canPick =
    match.status === "active" &&
    match.isMember &&
    match.myPick === null &&
    !busy;

  return (
    <main className="min-h-screen pb-16">
      <Nav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Room · {match.pickedCount}/6 selected
            </p>
            <h1 className="font-display text-5xl">
              Match {match.id.slice(-6).toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={match.status} />
            {user.isAdmin && match.status === "waiting" && (
              <button
                type="button"
                onClick={() => void startMatch()}
                disabled={busy}
                className="rounded-full bg-turf-500 px-5 py-2 font-semibold text-pitch-950"
              >
                {busy ? "Starting…" : "Start"}
              </button>
            )}
          </div>
        </div>

        {match.status === "waiting" && (
          <p className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Cards are hidden. {user.isAdmin
              ? "Click Start when everyone is ready. Players can then pick one card."
              : "Wait for an admin to click Start. Then you can pick one ticket."}
          </p>
        )}

        {match.status === "active" && match.isMember && match.myPick === null && (
          <p className="mb-5 rounded-2xl border border-turf-500/30 bg-turf-500/10 px-4 py-3 text-sm text-turf-400">
            Active — pick exactly one card. You will see Football or Volleyball after your tick.
          </p>
        )}

        {error && <p className="mb-4 text-sm text-volley-400">{error}</p>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {match.cards.map((card) => (
            <TicketCard
              key={card.position}
              card={card}
              mine={match.myPick === card.position}
              selectable={canPick && !card.taken}
              onPick={(position) => void pickCard(position)}
            />
          ))}
        </div>

        {match.myPick !== null && match.status !== "completed" && (
          <p className="mt-6 text-center text-white/70">
            You picked ticket {match.myPick + 1}. Waiting for the other players…
          </p>
        )}

        {match.groups && (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-turf-500/30 bg-turf-500/10 p-5">
              <div className="mb-3 flex items-center gap-3">
                <FootballIcon className="h-8 w-8" />
                <h2 className="font-display text-3xl">Football</h2>
              </div>
              <ul className="space-y-2">
                {match.groups.football.map((member) => (
                  <li
                    key={member.id}
                    className="rounded-2xl bg-black/20 px-4 py-3"
                  >
                    {member.displayId}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl border border-volley-500/30 bg-volley-500/10 p-5">
              <div className="mb-3 flex items-center gap-3">
                <VolleyballIcon className="h-8 w-8" />
                <h2 className="font-display text-3xl">Volleyball</h2>
              </div>
              <ul className="space-y-2">
                {match.groups.volleyball.map((member) => (
                  <li
                    key={member.id}
                    className="rounded-2xl bg-black/20 px-4 py-3"
                  >
                    {member.displayId}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
