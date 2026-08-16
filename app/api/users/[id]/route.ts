import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminId } from "@/lib/constants";
import { jsonError } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isAdmin) return jsonError("Only admins can delete a user.", 403);

  const { id } = await context.params;
  const targetId = id.trim().toLowerCase();
  if (targetId === user.id) return jsonError("You cannot delete your own account.");
  if (isAdminId(targetId)) return jsonError("Admin accounts cannot be deleted.");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return jsonError("User not found.", 404);
  if (target.isAdmin) return jsonError("Admin accounts cannot be deleted.");

  await prisma.$transaction(async (tx) => {
    await tx.card.updateMany({
      where: { pickedById: targetId },
      data: { pickedById: null },
    });
    await tx.matchMember.deleteMany({ where: { userId: targetId } });
    await tx.matchBlock.deleteMany({ where: { userId: targetId } });
    await tx.match.updateMany({
      where: { createdById: targetId },
      data: { createdById: user.id },
    });
    await tx.user.delete({ where: { id: targetId } });
  });

  return NextResponse.json({ ok: true });
}
