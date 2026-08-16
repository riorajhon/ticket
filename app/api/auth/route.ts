import { NextResponse } from "next/server";
import {
  applySessionCookie,
  clearSessionCookie,
  getCurrentUser,
  hashPassword,
  publicUser,
  verifyPassword,
} from "@/lib/auth";
import {
  displayIdFor,
  isAdminId,
  isValidId,
  normalizeId,
} from "@/lib/constants";
import { jsonError } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  return NextResponse.json({ user: publicUser(user) });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}

type AuthBody = {
  id?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AuthBody;
  const rawId = body.id ?? "";

  if (!isValidId(rawId)) {
    return jsonError("Enter a valid ID (1–32 letters, numbers, spaces).");
  }

  const id = normalizeId(rawId);
  const admin = isAdminId(id);
  const existing = await prisma.user.findUnique({ where: { id } });
  const password = body.password?.trim() ?? "";

  if (admin) {
    if (!existing) {
      if (!password) {
        return NextResponse.json({
          needsPasswordCreate: true,
          displayId: displayIdFor(rawId),
        });
      }
      if (password.length < 4) {
        return jsonError("Password must be at least 4 characters.");
      }
      const user = await prisma.user.create({
        data: {
          id,
          displayId: displayIdFor(rawId),
          isAdmin: true,
          passwordHash: await hashPassword(password),
        },
      });
      const response = NextResponse.json({ user: publicUser(user) });
      applySessionCookie(response, user.id);
      return response;
    }

    if (!existing.passwordHash) {
      if (!password) {
        return NextResponse.json({
          needsPasswordCreate: true,
          displayId: existing.displayId,
        });
      }
      if (password.length < 4) {
        return jsonError("Password must be at least 4 characters.");
      }
      const user = await prisma.user.update({
        where: { id },
        data: { passwordHash: await hashPassword(password), isAdmin: true },
      });
      const response = NextResponse.json({ user: publicUser(user) });
      applySessionCookie(response, user.id);
      return response;
    }

    if (!password) {
      return NextResponse.json({
        needsPassword: true,
        displayId: existing.displayId,
      });
    }

    const ok = await verifyPassword(password, existing.passwordHash);
    if (!ok) return jsonError("Wrong password.", 401);

    const response = NextResponse.json({ user: publicUser(existing) });
    applySessionCookie(response, existing.id);
    return response;
  }

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        id,
        displayId: displayIdFor(rawId),
        isAdmin: false,
      },
    }));

  const response = NextResponse.json({ user: publicUser(user) });
  applySessionCookie(response, user.id);
  return response;
}
