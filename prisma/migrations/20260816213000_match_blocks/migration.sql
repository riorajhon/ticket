-- CreateTable
CREATE TABLE "MatchBlock" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MatchBlock_pkey" PRIMARY KEY ("matchId","userId")
);

-- AddForeignKey
ALTER TABLE "MatchBlock" ADD CONSTRAINT "MatchBlock_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBlock" ADD CONSTRAINT "MatchBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
