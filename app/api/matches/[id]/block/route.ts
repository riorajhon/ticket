import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, matchInclude, toMatchView } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isAdmin) return jsonError("Only admins can block a user.", 403);

  const { id } = await context.params;
  const body = (await request.json()) as { userId?: string; blocked?: boolean };
  const targetId = body.userId?.trim().toLowerCase();
  if (!targetId) return jsonError("Choose a user to block.");

  const match = await prisma.match.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!match) return jsonError("Match not found.", 404);

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return jsonError("User not found.", 404);
  if (target.isAdmin) return jsonError("Admins cannot be blocked.");
  if (targetId === user.id) return jsonError("You cannot block yourself.");

  const shouldBlock = body.blocked !== false;

  if (shouldBlock) {
    await prisma.matchBlock.createMany({
      data: [{ matchId: id, userId: targetId }],
      skipDuplicates: true,
    });
    await prisma.matchMember.deleteMany({
      where: { matchId: id, userId: targetId },
    });
  } else {
    await prisma.matchBlock.deleteMany({
      where: { matchId: id, userId: targetId },
    });
  }

  const updated = await prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });
  if (!updated) return jsonError("Match not found.", 404);

  return NextResponse.json({ match: toMatchView(updated, user.id, user.isAdmin) });
}
