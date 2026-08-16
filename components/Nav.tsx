"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketMark } from "./Icons";
import type { PublicUser } from "@/lib/types";

export function Nav({ user }: { user: PublicUser }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-pitch-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/home" className="flex items-center gap-2">
          <TicketMark className="h-8 w-8" />
          <span className="font-display text-2xl tracking-wide">TICKET</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1">
            {user.displayId}
            {user.isAdmin && (
              <span className="ml-2 text-turf-400">Admin</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-white/60 hover:text-white"
          >
            Leave
          </button>
        </div>
      </div>
    </header>
  );
}
