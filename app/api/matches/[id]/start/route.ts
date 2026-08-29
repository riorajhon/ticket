import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isAdmin) return jsonError("Only admins can start a match.", 403);

  const { id } = await context.params;
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return jsonError("Match not found.", 404);
  if (match.status !== "waiting") {
    return jsonError("This match already started.");
  }

  const startedAt = new Date();
  const updated = await prisma.match.update({
    where: { id },
    data: {
      status: "active",
      startedAt,
    },
  });

  const serverNow = new Date();
  return NextResponse.json({
    ok: true,
    status: updated.status,
    startedAt: startedAt.toISOString(),
    readyAt: new Date(startedAt.getTime() + 5000).toISOString(),
    serverNow: serverNow.toISOString(),
  });
}
