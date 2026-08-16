import type { PublicUser } from "./types";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json()) as T & { error?: string };
  if (res.status === 401 && typeof window !== "undefined") {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/";
    throw new Error("Not signed in");
  }
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function fetchMe(): Promise<PublicUser> {
  const data = await fetchJson<{ user: PublicUser }>("/api/auth");
  return data.user;
}
