"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StatusBadge } from "@/components/StatusBadge";
import { TicketCard } from "@/components/TicketCard";
import { FootballIcon, VolleyballIcon } from "@/components/Icons";
import type { MatchView, PublicUser } from "@/lib/types";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [match, setMatch] = useState<MatchView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revealSport, setRevealSport] = useState<"football" | "volleyball" | null>(null);

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
    if (!revealSport) return;
    const timer = window.setTimeout(() => setRevealSport(null), 1600);
    return () => window.clearTimeout(timer);
  }, [revealSport]);

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

  async function deleteMatch() {
    if (!window.confirm("Delete this match for everyone?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not delete match.");
        return;
      }
      router.push("/home");
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
      if (data.sport && user) {
        setMatch((current) => {
          if (!current) return current;
          return {
            ...current,
            myPick: position,
            pickedCount: Math.min(6, current.pickedCount + 1),
            cards: current.cards.map((card) =>
              card.position === position
                ? {
                    ...card,
                    taken: true,
                    sport: data.sport,
                    pickedById: user.id,
                    pickedByDisplay: user.displayId,
                  }
                : card,
            ),
          };
        });
        setRevealSport(data.sport as "football" | "volleyball");
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
        {error.includes("blocked") && (
          <p className="px-8 text-white/50">An admin removed you from this room.</p>
        )}
      </main>
    );
  }

  const canPick =
    match.status === "active" &&
    !match.isBlocked &&
    match.myPick === null &&
    !busy;

  async function blockUser(userId: string, blocked: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${params.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blocked }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update block.");
        return;
      }
      setMatch(data.match);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen pb-16">
      {revealSport && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/35">
          <div className="reveal-pop rounded-[2rem] border border-white/15 bg-pitch-900/95 px-10 py-8 text-center shadow-card">
            <div className="mb-3 flex justify-center sport-spin">
              {revealSport === "football" ? (
                <FootballIcon className="h-20 w-20" />
              ) : (
                <VolleyballIcon className="h-20 w-20" />
              )}
            </div>
            <p className="font-display text-6xl tracking-wide">
              {revealSport === "football" ? "FOOTBALL" : "VOLLEYBALL"}
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.25em] text-white/50">
              Your ticket
            </p>
          </div>
        </div>
      )}
      <Nav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Room · {match.pickedCount}/6 selected
            </p>
            <h1 className="font-display text-5xl">
              {match.name}
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
            {user.isAdmin && (
              <button
                type="button"
                onClick={() => void deleteMatch()}
                disabled={busy}
                className="rounded-full border border-volley-500/40 px-5 py-2 font-semibold text-volley-400"
              >
                Delete match
              </button>
            )}
          </div>
        </div>

        {match.status === "waiting" && (
          <p className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Tickets are hidden. {user.isAdmin
              ? "Click Start when you are ready. Users can pick even if fewer than 6 people are in the room."
              : "Wait for an admin to click Start. Then pick one ticket — the room does not need 6 people first."}
          </p>
        )}

        {match.status === "active" && match.myPick === null && (
          <p className="mb-5 rounded-2xl border border-turf-500/30 bg-turf-500/10 px-4 py-3 text-sm text-turf-400">
            Started — pick one ticket. Your ID is saved on that ticket. When all 6 are taken, Football (3) and Volleyball (3) groups appear.
          </p>
        )}

        {error && <p className="mb-4 text-sm text-volley-400">{error}</p>}

        {(user.isAdmin || match.members.length > 0) && (
          <section className="mb-6 rounded-3xl border border-white/10 bg-pitch-900/70 p-5">
            <h2 className="font-display text-3xl">In this room</h2>
            <p className="mt-1 text-sm text-white/50">
              {user.isAdmin
                ? "Anyone can join. Block a user to kick them from this room."
                : "Everyone on the platform can enter this match."}
            </p>
            <ul className="mt-3 space-y-2">
              {match.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3"
                >
                  <span>
                    {member.displayId}
                    {member.id === user.id && (
                      <span className="ml-2 text-xs text-white/40">you</span>
                    )}
                  </span>
                  {user.isAdmin && member.id !== user.id && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void blockUser(member.id, true)}
                      className="rounded-full border border-volley-500/40 px-3 py-1 text-xs uppercase tracking-widest text-volley-400"
                    >
                      Block
                    </button>
                  )}
                </li>
              ))}
              {match.members.length === 0 && (
                <li className="text-sm text-white/40">No one has joined yet.</li>
              )}
            </ul>
            {user.isAdmin && match.blocked.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-white/40">Blocked</p>
                <ul className="mt-2 space-y-2">
                  {match.blocked.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 text-white/60"
                    >
                      <span>{member.displayId}</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void blockUser(member.id, false)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest"
                      >
                        Unblock
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

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
