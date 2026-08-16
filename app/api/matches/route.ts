import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, matchInclude, shuffledSports, toMatchView } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const matches = await prisma.match.findMany({
    orderBy: { createdAt: "desc" },
    include: matchInclude,
  });

  return NextResponse.json({
    matches: matches.map((match) => toMatchView(match, user.id, user.isAdmin)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isAdmin) return jsonError("Only admins can create a match.", 403);

  let memberIds: string[] = [];
  try {
    const body = (await request.json()) as { memberIds?: string[] };
    memberIds = [
      ...new Set((body.memberIds ?? []).map((id) => id.trim().toLowerCase()).filter(Boolean)),
    ];
  } catch {
    memberIds = [];
  }

  if (memberIds.length > 0) {
    const members = await prisma.user.findMany({
      where: { id: { in: memberIds } },
    });
    if (members.length !== memberIds.length) {
      return jsonError("Every selected ID must already exist on the platform.");
    }
  }

  const sports = shuffledSports();
  const match = await prisma.match.create({
    data: {
      createdById: user.id,
      status: "waiting",
      members: memberIds.length
        ? { create: memberIds.map((userId) => ({ userId })) }
        : undefined,
      cards: {
        create: sports.map((sport, position) => ({ position, sport })),
      },
    },
    include: matchInclude,
  });

  return NextResponse.json({ match: toMatchView(match, user.id, user.isAdmin) });
}
