import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, serializeCards, shuffledSports } from "@/lib/match";
import { prisma } from "@/lib/prisma";

const matchInclude = {
  createdBy: true,
  members: { include: { user: true } },
  cards: { include: { pickedBy: true } },
} as const;

function viewMatch(
  match: Awaited<ReturnType<typeof loadMatch>>,
  viewerId: string,
  isAdmin: boolean,
) {
  if (!match) return null;
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

async function loadMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const matches = user.isAdmin
    ? await prisma.match.findMany({
        orderBy: { createdAt: "desc" },
        include: matchInclude,
      })
    : await prisma.match.findMany({
        where: { members: { some: { userId: user.id } } },
        orderBy: { createdAt: "desc" },
        include: matchInclude,
      });

  return NextResponse.json({
    matches: matches.map((match) => viewMatch(match, user.id, user.isAdmin)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isAdmin) return jsonError("Only admins can create a match.", 403);

  const body = (await request.json()) as { memberIds?: string[] };
  const memberIds = [...new Set((body.memberIds ?? []).map((id) => id.trim().toLowerCase()))];

  if (memberIds.length !== 6) {
    return jsonError("Select exactly 6 members.");
  }

  const members = await prisma.user.findMany({
    where: { id: { in: memberIds } },
  });
  if (members.length !== 6) {
    return jsonError("Every selected ID must already exist on the platform.");
  }

  const sports = shuffledSports();
  const match = await prisma.match.create({
    data: {
      createdById: user.id,
      status: "waiting",
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
      cards: {
        create: sports.map((sport, position) => ({ position, sport })),
      },
    },
    include: matchInclude,
  });

  return NextResponse.json({ match: viewMatch(match, user.id, user.isAdmin) });
}
