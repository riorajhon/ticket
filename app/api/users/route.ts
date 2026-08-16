import { NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { jsonError } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isAdmin) return jsonError("Admins only.", 403);

  const users = await prisma.user.findMany({
    orderBy: { displayId: "asc" },
  });

  return NextResponse.json({ users: users.map(publicUser) });
}
