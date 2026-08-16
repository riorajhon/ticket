import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, matchInclude, toMatchView } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  let match = await prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });
  if (!match) return jsonError("Match not found.", 404);

  const blocked = match.blocks.some((block) => block.userId === user.id);
  if (blocked && !user.isAdmin) {
    return jsonError("You were blocked from this room.", 403);
  }

  const alreadyIn = match.members.some((m) => m.userId === user.id);
  if (!blocked && !alreadyIn) {
    await prisma.matchMember.createMany({
      data: [{ matchId: id, userId: user.id }],
      skipDuplicates: true,
    });
    match = await prisma.match.findUnique({
      where: { id },
      include: matchInclude,
    });
    if (!match) return jsonError("Match not found.", 404);
  }

  return NextResponse.json({ match: toMatchView(match, user.id, user.isAdmin) });
}
