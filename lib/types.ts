export type PublicUser = {
  id: string;
  displayId: string;
  isAdmin: boolean;
};

export type PublicCard = {
  position: number;
  taken: boolean;
  pickedById?: string | null;
  pickedByDisplay?: string | null;
  sport?: "football" | "volleyball";
  isGoalkeeper?: boolean;
};

export type Member = {
  id: string;
  displayId: string;
  isGoalkeeper?: boolean;
};

export type Groups = {
  football: Member[];
  volleyball: Member[];
} | null;

export type MatchView = {
  id: string;
  name: string;
  status: "waiting" | "active" | "completed";
  createdAt: string;
  startedAt: string | null;
  readyAt: string | null;
  readySecondsLeft: number;
  serverNow?: string;
  createdBy: Member;
  isMember: boolean;
  isBlocked: boolean;
  members: Member[];
  blocked: Member[];
  cards: PublicCard[];
  groups: Groups;
  myPick: number | null;
  pickedCount: number;
};
