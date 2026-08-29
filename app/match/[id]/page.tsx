"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StatusBadge } from "@/components/StatusBadge";
import { TicketCard } from "@/components/TicketCard";
import { ReadyOverlay } from "@/components/ReadyOverlay";
import { readySecondsLeft } from "@/lib/match";
import type { MatchView, PublicUser } from "@/lib/types";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [match, setMatch] = useState<MatchView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [showReadyFlash, setShowReadyFlash] = useState(false);
  const [reveal, setReveal] = useState<{
    sport: "football" | "volleyball";
    isGoalkeeper: boolean;
  } | null>(null);

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
    if (!reveal) return;
    const timer = window.setTimeout(() => setReveal(null), 1800);
    return () => window.clearTimeout(timer);
  }, [reveal]);

  useEffect(() => {
    if (!params.id) return;
    void loadMatch();
    const timer = window.setInterval(() => void loadMatch(), 1000);
    return () => window.clearInterval(timer);
  }, [params.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(
    () => (match?.status === "active" ? readySecondsLeft(match.startedAt, now) : 0),
    [match?.status, match?.startedAt, now],
  );
  const pickingOpen = match?.status === "active" && countdown === 0;

  useEffect(() => {
    if (countdown > 0) {
      setShowReadyFlash(true);
      return;
    }
    if (!showReadyFlash) return;
    const timer = window.setTimeout(() => setShowReadyFlash(false), 950);
    return () => window.clearTimeout(timer);
  }, [countdown, showReadyFlash]);

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
    if (readySecondsLeft(match.startedAt) > 0) return;
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
        const isGoalkeeper = Boolean(data.isGoalkeeper);
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
                    isGoalkeeper,
                    pickedById: user.id,
                    pickedByDisplay: user.displayId,
                  }
                : card,
            ),
          };
        });
        setReveal({
          sport: data.sport as "football" | "volleyball",
          isGoalkeeper,
        });
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
    pickingOpen &&
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
    <main className="min-h-screen pb-8">
      {(countdown > 0 || showReadyFlash) && match.status === "active" && (
        <ReadyOverlay seconds={countdown} matchName={match.name} />
      )}
      {reveal && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/35">
          <div className="reveal-pop rounded-[2rem] border border-white/15 bg-pitch-900/95 px-10 py-8 text-center shadow-card">
            <div className="mb-3 flex justify-center gap-3 sport-spin text-7xl" aria-hidden>
              {reveal.sport === "football" ? (
                reveal.isGoalkeeper ? (
                  <>
                    <span>⚽</span>
                    <span>🧤</span>
                  </>
                ) : (
                  <span>⚽</span>
                )
              ) : (
                <span>🏐</span>
              )}
            </div>
            <p className="font-display text-6xl tracking-wide">
              {reveal.sport === "football" ? "FOOTBALL" : "VOLLEYBALL"}
            </p>
            {reveal.isGoalkeeper && (
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
                ⚽ 🧤 Goalkeeper ticket
              </p>
            )}
            {reveal.sport === "football" && !reveal.isGoalkeeper && (
              <p className="mt-2 text-sm uppercase tracking-[0.25em] text-white/50">
                ⚽ Common ticket
              </p>
            )}
            {reveal.sport === "volleyball" && (
              <p className="mt-2 text-sm uppercase tracking-[0.25em] text-white/50">
                🏐 Your ticket
              </p>
            )}
          </div>
        </div>
      )}
      <Nav user={user} />
      <div className="mx-auto max-w-[1600px] px-3 py-4 md:px-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Room · {match.pickedCount}/6 selected
            </p>
            <h1 className="font-display text-4xl md:text-5xl">{match.name}</h1>
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

        <div className="vote-split">
          <section className="vote-tickets min-w-0">
            {match.status === "waiting" && (
              <p className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                Tickets are hidden. {user.isAdmin
                  ? "Click Start when you are ready. A 5-second countdown begins, then anyone can pick."
                  : "Wait for an admin to click Start. After a 5-second ready timer, pick one ticket."}
              </p>
            )}

            {pickingOpen && match.myPick === null && (
              <p className="mb-4 rounded-2xl border border-turf-500/30 bg-turf-500/10 px-4 py-3 text-sm text-turf-400">
                Go — pick one ticket. Your ID is saved on that ticket.
              </p>
            )}

            {error && <p className="mb-4 text-sm text-volley-400">{error}</p>}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
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
              <p className="mt-5 text-center text-white/70">
                You picked ticket {match.myPick + 1}. Waiting for the other players…
              </p>
            )}
          </section>

          <aside className="vote-side space-y-3">
            <section className="rounded-3xl border border-white/10 bg-pitch-900/80 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Progress</p>
              <p className="mt-1 font-display text-3xl">{match.pickedCount}/6</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-turf-500 transition-all duration-500"
                  style={{ width: `${(match.pickedCount / 6) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/50">
                {match.status === "waiting"
                  ? "Waiting for Start"
                  : match.status === "completed"
                    ? "Complete"
                    : pickingOpen
                      ? "Voting open"
                      : "Get ready…"}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-pitch-900/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-2xl">Users</h2>
                <span className="text-xs text-white/40">{match.members.length}</span>
              </div>
              <ul className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
                {match.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-black/25 px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      {member.displayId}
                      {member.id === user.id && (
                        <span className="ml-1 text-[10px] text-white/40">you</span>
                      )}
                    </span>
                    {user.isAdmin && member.id !== user.id && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void blockUser(member.id, true)}
                        className="shrink-0 rounded-full border border-volley-500/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-volley-400"
                      >
                        Block
                      </button>
                    )}
                  </li>
                ))}
                {match.members.length === 0 && (
                  <li className="text-sm text-white/40">No one yet</li>
                )}
              </ul>
              {user.isAdmin && match.blocked.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Blocked</p>
                  <ul className="mt-2 space-y-2">
                    {match.blocked.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-2 rounded-2xl bg-black/25 px-3 py-2 text-sm text-white/60"
                      >
                        <span className="truncate">{member.displayId}</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void blockUser(member.id, false)}
                          className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-widest"
                        >
                          Unblock
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-pitch-900/80 p-4">
              <h2 className="font-display text-2xl">Result</h2>
              {!match.groups ? (
                <p className="mt-2 text-sm text-white/45">
                  Groups appear when all 6 tickets are taken.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-turf-500/30 bg-turf-500/10 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span aria-hidden="true">⚽</span>
                      <h3 className="font-display text-xl">Football</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {match.groups.football.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center justify-between rounded-xl bg-black/20 px-2.5 py-1.5 text-sm"
                        >
                          <span className="truncate">{member.displayId}</span>
                          {member.isGoalkeeper && (
                            <span className="rounded-full bg-yellow-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-pitch-950">
                              ⚽ GK
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-volley-500/30 bg-volley-500/10 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span aria-hidden="true">🏐</span>
                      <h3 className="font-display text-xl">Volleyball</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {match.groups.volleyball.map((member) => (
                        <li
                          key={member.id}
                          className="rounded-xl bg-black/20 px-2.5 py-1.5 text-sm"
                        >
                          {member.displayId}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
