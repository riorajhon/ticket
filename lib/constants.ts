export const COOKIE_NAME = "ticket_session";
export const ADMIN_IDS = ["gabriel", "riora"] as const;

export function normalizeId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isAdminId(raw: string): boolean {
  const id = normalizeId(raw);
  return id === "gabriel" || id === "riora";
}

export function displayIdFor(raw: string): string {
  const id = normalizeId(raw);
  if (id === "gabriel") return "Gabriel";
  if (id === "riora") return "Riora";
  return raw.trim();
}

export function isValidId(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 1 || trimmed.length > 32) return false;
  return /^[A-Za-z0-9][A-Za-z0-9 _.-]*$/.test(trimmed);
}
