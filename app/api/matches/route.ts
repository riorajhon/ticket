import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, matchInclude, shuffledTickets, toMatchView } from "@/lib/match";
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

  let body: { memberIds?: string[]; name?: string } = {};
  try {
    body = (await request.json()) as { memberIds?: string[]; name?: string };
  } catch {
    body = {};
  }

  const name = (body.name ?? "").trim();
  if (name.length < 1 || name.length > 40) {
    return jsonError("Enter a match name (1–40 characters).");
  }

  let memberIds: string[] = [
    ...new Set((body.memberIds ?? []).map((id) => id.trim().toLowerCase()).filter(Boolean)),
  ];

  if (memberIds.length > 0) {
    const members = await prisma.user.findMany({
      where: { id: { in: memberIds } },
    });
    if (members.length !== memberIds.length) {
      return jsonError("Every selected ID must already exist on the platform.");
    }
  }

  const tickets = shuffledTickets();
  const match = await prisma.match.create({
    data: {
      name,
      createdById: user.id,
      status: "waiting",
      members: memberIds.length
        ? { create: memberIds.map((userId) => ({ userId })) }
        : undefined,
      cards: {
        create: tickets.map((ticket, position) => ({
          position,
          sport: ticket.sport,
          isGoalkeeper: ticket.isGoalkeeper,
        })),
      },
    },
    include: matchInclude,
  });

  return NextResponse.json({ match: toMatchView(match, user.id, user.isAdmin) });
}
