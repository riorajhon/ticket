"use client";

import { useEffect, useState } from "react";
import type { PublicCard } from "@/lib/types";

type Phase = "idle" | "out" | "flip" | "back";

type Props = {
  card: PublicCard;
  selectable: boolean;
  mine: boolean;
  onPick: (position: number) => void;
};

function barcodeBars(seed: number) {
  return Array.from({ length: 18 }, (_, i) => 1 + ((seed * 7 + i * 3) % 4));
}

export function TicketCard({ card, selectable, mine, onPick }: Props) {
  const revealed = Boolean(card.sport);
  const takenByOther = card.taken && !mine && !revealed;
  const isGoalkeeper = Boolean(card.isGoalkeeper);
  const [phase, setPhase] = useState<Phase>(revealed ? "back" : "idle");
  const bars = barcodeBars(card.position + 1);

  useEffect(() => {
    if (!card.sport) return;
    if (phase === "out") {
      setPhase("flip");
      const flipTimer = window.setTimeout(() => setPhase("back"), 900);
      return () => window.clearTimeout(flipTimer);
    }
    if (phase === "idle") setPhase("back");
  }, [card.sport, phase]);

  function handleClick() {
    if (!selectable) return;
    setPhase("out");
    onPick(card.position);
  }

  const frontEmoji =
    card.sport === "football" ? (isGoalkeeper ? "🧤" : "⚽") : "🏐";
  const frontTitle =
    card.sport === "football"
      ? isGoalkeeper
        ? "GOALKEEPER"
        : "FOOTBALL"
      : "VOLLEYBALL";

  return (
    <div
      className={`ticket-stage ${selectable ? "selectable" : ""} ${phase} ${
        takenByOther ? "opacity-80" : ""
      }`}
      style={{ ["--deal-delay" as string]: `${card.position * 90}ms` }}
    >
      <button
        type="button"
        disabled={!selectable}
        onClick={handleClick}
        className={`ticket-scene group w-full text-left ${revealed ? "revealed" : ""} ${
          selectable ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="ticket-inner">
          <div className="ticket-face ticket-back relative flex flex-col p-0">
            <span className="ticket-notch left" />
            <span className="ticket-notch right" />
            <div className="ticket-paper ticket-paper-back flex h-full flex-col">
              <div className="ticket-stripe ticket-stripe-mystery" />
              <div className="flex flex-1 flex-col items-center justify-between px-4 py-4">
                <div className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-ticket-muted">
                  <span>
                    <span aria-hidden="true">🎟️ </span>
                    Admit one
                  </span>
                  <span>No. 0{card.position + 1}</span>
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="ticket-emoji-bounce text-5xl" aria-hidden="true">
                    🎫
                  </span>
                  <p className="font-display text-4xl tracking-wide text-ticket-ink">
                    MYSTERY
                  </p>
                  <p className="ticket-chip ticket-chip-muted">
                    Flip after start
                  </p>
                  <div className="mt-1 flex gap-2 text-xl opacity-80" aria-hidden="true">
                    <span>⚽</span>
                    <span>🏐</span>
                    <span>🧤</span>
                  </div>
                </div>

                <div className="w-full">
                  <div className="ticket-perforation" />
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div className="ticket-barcode">
                      {bars.map((w, i) => (
                        <span key={i} style={{ width: `${w}px` }} />
                      ))}
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ticket-ink/25">
                      {card.taken ? (
                        <span className="text-sm" aria-hidden="true">
                          ✅
                        </span>
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-ticket-ink/25" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {takenByOther && (
              <div className="absolute inset-0 flex items-center justify-center bg-ticket-ink/45 backdrop-blur-[1px]">
                <span className="rounded-full bg-ticket-ink/80 px-3 py-1 text-xs uppercase tracking-widest text-ticket-cream">
                  Taken
                </span>
              </div>
            )}
          </div>

          <div
            className={`ticket-face ticket-front ${card.sport ?? ""} ${
              isGoalkeeper ? "goalkeeper" : ""
            } relative flex flex-col p-0`}
          >
            <span className="ticket-notch left" />
            <span className="ticket-notch right" />
            <div
              className={`ticket-paper flex h-full flex-col ${
                card.sport === "football"
                  ? isGoalkeeper
                    ? "ticket-paper-gk"
                    : "ticket-paper-football"
                  : "ticket-paper-volleyball"
              }`}
            >
              <div
                className={`ticket-stripe ${
                  card.sport === "football"
                    ? isGoalkeeper
                      ? "ticket-stripe-gk"
                      : "ticket-stripe-football"
                    : "ticket-stripe-volleyball"
                }`}
              />
              <div className="relative flex flex-1 flex-col items-center justify-between px-4 py-4">
                <div className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-ticket-ink/70">
                  <span>
                    <span aria-hidden="true">🏟️ </span>
                    Live event
                  </span>
                  <span>Seat 0{card.position + 1}</span>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <span
                    className={`ticket-emoji-main text-6xl ${
                      revealed ? "sport-spin" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {frontEmoji}
                  </span>
                  <p className="font-display text-[2.4rem] leading-none tracking-wide text-ticket-ink">
                    {frontTitle}
                  </p>
                  {isGoalkeeper && (
                    <span className="ticket-chip ticket-chip-gk">
                      <span aria-hidden="true">🧤 </span>
                      Goalkeeper
                    </span>
                  )}
                  {card.sport === "football" && !isGoalkeeper && (
                    <span className="ticket-chip ticket-chip-light">
                      <span aria-hidden="true">⚽ </span>
                      Common player
                    </span>
                  )}
                  {card.sport === "volleyball" && (
                    <span className="ticket-chip ticket-chip-light">
                      <span aria-hidden="true">🏐 </span>
                      Court player
                    </span>
                  )}
                  {card.pickedByDisplay && (
                    <p className="mt-2 text-sm font-medium text-ticket-ink/90">
                      {card.pickedByDisplay}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <div className="ticket-perforation dark" />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="ticket-barcode dark">
                      {bars.map((w, i) => (
                        <span key={i} style={{ width: `${w}px` }} />
                      ))}
                    </div>
                    {mine ? (
                      <span className="rounded-full bg-ticket-ink px-3 py-1 text-[10px] uppercase tracking-widest text-ticket-cream">
                        Yours
                      </span>
                    ) : (
                      <span className="text-lg" aria-hidden="true">
                        🎟️
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
