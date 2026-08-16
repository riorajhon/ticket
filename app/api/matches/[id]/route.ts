import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, serializeCards } from "@/lib/match";
import { prisma } from "@/lib/prisma";

const matchInclude = {
  createdBy: true,
  members: { include: { user: true } },
  cards: { include: { pickedBy: true } },
} as const;

function viewMatch(
  match: NonNullable<Awaited<ReturnType<typeof findMatch>>>,
  viewerId: string,
  isAdmin: boolean,
) {
  const isMember = match.members.some((m) => m.userId === viewerId);
  const completed = match.status === "completed";
  const groups = completed
    ? {
        football: match.cards
          .filter((c) => c.sport === "football" && c.pickedBy)
          .map((c) => ({
            id: c.pickedById as string,
            displayId: c.pickedBy?.displayId ?? c.pickedById,
          })),
        volleyball: match.cards
          .filter((c) => c.sport === "volleyball" && c.pickedBy)
          .map((c) => ({
            id: c.pickedById as string,
            displayId: c.pickedBy?.displayId ?? c.pickedById,
          })),
      }
    : null;

  return {
    id: match.id,
    status: match.status,
    createdAt: match.createdAt,
    createdBy: {
      id: match.createdBy.id,
      displayId: match.createdBy.displayId,
    },
    isMember,
    members: match.members.map((m) => ({
      id: m.user.id,
      displayId: m.user.displayId,
    })),
    cards: serializeCards(
      match.cards,
      viewerId,
      isAdmin,
      match.status,
      isMember,
    ),
    groups,
    myPick: match.cards.find((c) => c.pickedById === viewerId)?.position ?? null,
    pickedCount: match.cards.filter((c) => c.pickedById).length,
  };
}

async function findMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  const match = await findMatch(id);
  if (!match) return jsonError("Match not found.", 404);

  const isMember = match.members.some((m) => m.userId === user.id);
  if (!isMember && !user.isAdmin) {
    return jsonError("Only selected members can open this match.", 403);
  }

  return NextResponse.json({ match: viewMatch(match, user.id, user.isAdmin) });
}
