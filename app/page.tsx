"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FootballIcon, TicketMark, VolleyballIcon } from "@/components/Icons";
import { isAdminId } from "@/lib/constants";

type Step = "id" | "create" | "password";

export default function EnterPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<Step>("id");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const adminHint = useMemo(() => isAdminId(id), [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (step === "create" && password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          password: step === "id" ? undefined : password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not enter.");
        return;
      }
      if (data.user) {
        router.push("/home");
        router.refresh();
        return;
      }
      if (data.needsPasswordCreate) {
        setStep("create");
        return;
      }
      if (data.needsPassword) {
        setStep("password");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pitch-grid min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-12">
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <FootballIcon className="h-9 w-9" />
            <TicketMark className="h-10 w-10" />
            <VolleyballIcon className="h-9 w-9" />
          </div>
          <h1 className="font-display text-6xl tracking-wide">TICKET</h1>
          <p className="mt-2 text-white/60">Enter with your ID. Pick one hidden card.</p>
        </div>

        <form
          onSubmit={(event) => void submit(event)}
          className="rounded-3xl border border-white/10 bg-pitch-900/80 p-6 shadow-card"
        >
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">
            Your ID
          </label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. Alex"
            autoFocus
            disabled={step !== "id"}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-turf-500/40 focus:ring-2"
          />

          {adminHint && step === "id" && (
            <p className="mt-3 text-sm text-turf-400">
              Gabriel and Riora are admins. You will set or enter a password next.
            </p>
          )}

          {step === "create" && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-white/70">
                First time as admin. Create a password.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-turf-500/40 focus:ring-2"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-turf-500/40 focus:ring-2"
              />
            </div>
          )}

          {step === "password" && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-white/70">Admin password required.</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-turf-500/40 focus:ring-2"
              />
            </div>
          )}

          {error && <p className="mt-4 text-sm text-volley-400">{error}</p>}

          <button
            type="submit"
            disabled={busy || !id.trim()}
            className="mt-6 w-full rounded-2xl bg-turf-500 py-3 font-semibold text-pitch-950 disabled:opacity-40"
          >
            {busy ? "Entering…" : step === "id" ? "Enter" : "Continue"}
          </button>

          {step !== "id" && (
            <button
              type="button"
              className="mt-3 w-full text-sm text-white/50"
              onClick={() => {
                setStep("id");
                setPassword("");
                setConfirm("");
              }}
            >
              Use a different ID
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
