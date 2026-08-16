import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hashPassword,
  publicUser,
  verifyPassword,
} from "@/lib/auth";
import { jsonError } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isAdmin) return jsonError("Only admins can set a password.", 403);

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const currentPassword = body.currentPassword?.trim() ?? "";
  const newPassword = body.newPassword?.trim() ?? "";

  if (newPassword.length < 4) {
    return jsonError("New password must be at least 4 characters.");
  }

  if (user.passwordHash) {
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return jsonError("Current password is wrong.", 401);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return NextResponse.json({ user: publicUser(updated), ok: true });
}
