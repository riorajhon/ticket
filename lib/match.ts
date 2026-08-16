import type { Sport } from "@prisma/client";
import type { MatchView, PublicCard } from "./types";

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function shuffledSports(): Sport[] {
  return shuffle<Sport>([
    "football",
    "football",
    "football",
    "volleyball",
    "volleyball",
    "volleyball",
  ]);
}

type CardRow = {
  position: number;
  sport: Sport;
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
  const groups = completed
    ? {
        football: match.cards
          .filter((c) => c.sport === "football" && c.pickedBy)
          .map((c) => ({
            id: (c.pickedById ?? "") as string,
            displayId: c.pickedBy?.displayId ?? c.pickedById ?? "",
          })),
        volleyball: match.cards
          .filter((c) => c.sport === "volleyball" && c.pickedBy)
          .map((c) => ({
            id: (c.pickedById ?? "") as string,
            displayId: c.pickedBy?.displayId ?? c.pickedById ?? "",
          })),
      }
    : null;

  return {
    id: match.id,
    name: match.name?.trim() || `Match ${match.id.slice(-6).toUpperCase()}`,
    status: match.status as MatchView["status"],
    createdAt: match.createdAt.toISOString(),
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
