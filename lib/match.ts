import type { Sport } from "@prisma/client";
import type { PublicCard } from "./types";

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
