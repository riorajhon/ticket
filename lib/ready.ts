export const READY_SECONDS = 5;

export function readyAtFrom(startedAt: Date | string | null | undefined) {
  if (!startedAt) return null;
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + READY_SECONDS * 1000);
}

/** Always pass server-aligned `now` (UTC ms). */
export function readySecondsLeft(
  startedAt: Date | string | null | undefined,
  nowMs: number,
) {
  const readyAt = readyAtFrom(startedAt);
  if (!readyAt) return 0;
  return Math.max(0, Math.ceil((readyAt.getTime() - nowMs) / 1000));
}

export function isReadyToPick(
  startedAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
) {
  const readyAt = readyAtFrom(startedAt);
  if (!readyAt) return false;
  return nowMs >= readyAt.getTime();
}

/** Sync local clock to server UTC. Positive skew means server is ahead. */
export function clockSkewMs(serverNowIso: string, clientNowMs = Date.now()) {
  const serverMs = Date.parse(serverNowIso);
  if (Number.isNaN(serverMs)) return 0;
  return serverMs - clientNowMs;
}

export function serverAlignedNow(skewMs: number, clientNowMs = Date.now()) {
  return clientNowMs + skewMs;
}
