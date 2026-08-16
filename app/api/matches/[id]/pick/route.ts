import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  const body = (await request.json()) as { position?: number };
  const position = body.position;

  if (typeof position !== "number" || position < 0 || position > 5) {
    return jsonError("Pick one of the 6 cards.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id },
      include: { members: true, cards: true, blocks: true },
    });
    if (!match) return { error: "Match not found.", status: 404 };
    if (match.status === "waiting") {
      return { error: "Wait for the admin to click Start, then pick one ticket.", status: 400 };
    }
    if (match.status === "completed") {
      return { error: "This match is already complete.", status: 400 };
    }

    const blocked = match.blocks.some((block) => block.userId === user.id);
    if (blocked) {
      return { error: "You were blocked from this room.", status: 403 };
    }

    await tx.matchMember.createMany({
      data: [{ matchId: id, userId: user.id }],
      skipDuplicates: true,
    });

    const alreadyPicked = match.cards.some((c) => c.pickedById === user.id);
    if (alreadyPicked) {
      return { error: "You already picked a card.", status: 400 };
    }

    const card = match.cards.find((c) => c.position === position);
    if (!card) return { error: "Card not found.", status: 404 };
    if (card.pickedById) {
      return { error: "That card is already taken.", status: 409 };
    }

    const claimed = await tx.card.updateMany({
      where: { id: card.id, pickedById: null },
      data: { pickedById: user.id },
    });
    if (claimed.count !== 1) {
      return { error: "That card is already taken.", status: 409 };
    }

    const pickedCount = await tx.card.count({
      where: { matchId: id, pickedById: { not: null } },
    });

    if (pickedCount >= 6) {
      await tx.match.update({
        where: { id },
        data: { status: "completed" },
      });
    }

    return { error: null, status: 200, sport: card.sport };
  });

  if (result.error) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ ok: true, sport: result.sport });
}
