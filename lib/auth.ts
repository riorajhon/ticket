import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { COOKIE_NAME } from "./constants";

const SECRET =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "ticket-platform-local-secret-2026");
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function requireSecret() {
  if (!SECRET) {
    throw new Error("SESSION_SECRET must be set in the Vercel environment.");
  }
  return SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", requireSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + MAX_AGE_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string): { userId: string } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId: string;
      exp: number;
    };
    if (!data.userId || data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export function applySessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(COOKIE_NAME, createSessionToken(userId), {
    ...cookieBase,
    maxAge: MAX_AGE_MS / 1000,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    ...cookieBase,
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = readSessionToken(token);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function publicUser(user: {
  id: string;
  displayId: string;
  isAdmin: boolean;
}) {
  return {
    id: user.id,
    displayId: user.displayId,
    isAdmin: user.isAdmin,
  };
}
