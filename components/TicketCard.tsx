"use client";

import { useEffect, useState } from "react";
import { FootballIcon, TicketMark, VolleyballIcon } from "./Icons";
import type { PublicCard } from "@/lib/types";

type Phase = "idle" | "out" | "flip" | "back";

type Props = {
  card: PublicCard;
  selectable: boolean;
  mine: boolean;
  onPick: (position: number) => void;
};

export function TicketCard({ card, selectable, mine, onPick }: Props) {
  const revealed = Boolean(card.sport);
  const takenByOther = card.taken && !mine && !revealed;
  const [phase, setPhase] = useState<Phase>(revealed ? "back" : "idle");

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
          <div className="ticket-face ticket-back relative flex flex-col items-center justify-between p-4">
            <span className="ticket-notch left" />
            <span className="ticket-notch right" />
            <div className="flex w-full items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/70">
              <span>Admit one</span>
              <span>0{card.position + 1}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TicketMark className="h-12 w-12" />
              <p className="font-display text-4xl tracking-wide text-white">TICKET</p>
              <p className="text-[11px] uppercase tracking-[0.25em] text-turf-400">
                Hidden sport
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40">
              {card.taken ? (
                <span className="text-sm text-turf-400">✓</span>
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
              )}
            </div>
            <span className="ticket-stub" />
            {takenByOther && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-widest text-white/80">
                  Taken
                </span>
              </div>
            )}
          </div>
          <div
            className={`ticket-face ticket-front ${card.sport ?? ""} flex flex-col items-center justify-center gap-3 p-4`}
          >
            <span className="ticket-notch left" />
            <span className="ticket-notch right" />
            <div className={revealed ? "sport-spin" : ""}>
              {card.sport === "football" ? (
                <FootballIcon className="h-16 w-16" />
              ) : (
                <VolleyballIcon className="h-16 w-16" />
              )}
            </div>
            <p className="font-display text-4xl tracking-wide text-white">
              {card.sport === "football" ? "FOOTBALL" : "VOLLEYBALL"}
            </p>
            {card.pickedByDisplay && (
              <p className="text-sm text-white/80">{card.pickedByDisplay}</p>
            )}
            {mine && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-widest">
                Your ticket
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
