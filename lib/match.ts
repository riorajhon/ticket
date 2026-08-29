import type { Sport } from "@prisma/client";
import type { MatchView, PublicCard } from "./types";
import { readyAtFrom, readySecondsLeft } from "./ready";

export { READY_SECONDS, isReadyToPick, readyAtFrom, readySecondsLeft } from "./ready";

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export type TicketSeed = {
  sport: Sport;
  isGoalkeeper: boolean;
};

export function shuffledTickets(): TicketSeed[] {
  return shuffle<TicketSeed>([
    { sport: "football", isGoalkeeper: false },
    { sport: "football", isGoalkeeper: true },
    { sport: "football", isGoalkeeper: true },
    { sport: "volleyball", isGoalkeeper: false },
    { sport: "volleyball", isGoalkeeper: false },
    { sport: "volleyball", isGoalkeeper: false },
  ]);
}

type CardRow = {
  position: number;
  sport: Sport;
  isGoalkeeper?: boolean;
  pickedById: string | null;
  pickedBy?: { displayId: string } | null;
};

export function serializeCards(
  cards: CardRow[],
  viewerId: string,
  isAdmin: boolean,
  status: string,
  isMember: boolean,
): PublicCard[] {
  const completed = status === "completed";
  const canSeeAll = completed;

  return [...cards]
    .sort((a, b) => a.position - b.position)
    .map((card) => {
      const mine = card.pickedById === viewerId;
      const revealed = canSeeAll || mine;
      const publicCard: PublicCard = {
        position: card.position,
        taken: Boolean(card.pickedById),
      };

      if (card.pickedById && (revealed || isAdmin || isMember)) {
        publicCard.pickedById = revealed || completed ? card.pickedById : null;
        publicCard.pickedByDisplay =
          revealed || completed ? (card.pickedBy?.displayId ?? null) : null;
      }

      if (revealed) {
        publicCard.sport = card.sport;
        publicCard.isGoalkeeper = Boolean(card.isGoalkeeper);
        publicCard.pickedById = card.pickedById;
        publicCard.pickedByDisplay = card.pickedBy?.displayId ?? null;
      }

      return publicCard;
    });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

type MatchRow = {
  id: string;
  name?: string;
  status: string;
  createdAt: Date;
  startedAt?: Date | null;
  createdBy: { id: string; displayId: string };
  members: { userId: string; user: { id: string; displayId: string } }[];
  cards: CardRow[];
  blocks?: { userId: string; user?: { id: string; displayId: string } }[];
};

export const matchInclude = {
  createdBy: true,
  members: { include: { user: true } },
  cards: { include: { pickedBy: true } },
  blocks: { include: { user: true } },
} as const;

export function toMatchView(
  match: MatchRow,
  viewerId: string,
  isAdmin: boolean,
): MatchView {
  const isBlocked = Boolean(match.blocks?.some((block) => block.userId === viewerId));
  const isMember = match.members.some((m) => m.userId === viewerId);
  const completed = match.status === "completed";
  const allTicketsTaken = match.cards.filter((c) => c.pickedById).length >= 6;
  const groups =
    completed || allTicketsTaken
      ? {
          football: match.cards
            .filter((c) => c.sport === "football" && c.pickedById)
            .map((c) => ({
              id: (c.pickedById ?? "") as string,
              displayId: c.pickedBy?.displayId ?? c.pickedById ?? "",
              isGoalkeeper: Boolean(c.isGoalkeeper),
            })),
          volleyball: match.cards
            .filter((c) => c.sport === "volleyball" && c.pickedById)
            .map((c) => ({
              id: (c.pickedById ?? "") as string,
              displayId: c.pickedBy?.displayId ?? c.pickedById ?? "",
            })),
        }
      : null;

  const serverNow = Date.now();
  const readyAt = match.startedAt ? readyAtFrom(match.startedAt) : null;

  return {
    id: match.id,
    name: match.name?.trim() || `Match ${match.id.slice(-6).toUpperCase()}`,
    status: match.status as MatchView["status"],
    createdAt: match.createdAt.toISOString(),
    startedAt: match.startedAt ? match.startedAt.toISOString() : null,
    readyAt: readyAt ? readyAt.toISOString() : null,
    readySecondsLeft: readySecondsLeft(match.startedAt, serverNow),
    serverNow: new Date(serverNow).toISOString(),
    createdBy: {
      id: match.createdBy.id,
      displayId: match.createdBy.displayId,
    },
    isMember,
    isBlocked,
    members: match.members.map((m) => ({
      id: m.user.id,
      displayId: m.user.displayId,
    })),
    blocked: isAdmin
      ? (match.blocks ?? []).map((block) => ({
          id: block.userId,
          displayId: block.user?.displayId ?? block.userId,
        }))
      : [],
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
