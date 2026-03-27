import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leaderboardTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const entries = await db
    .select()
    .from(leaderboardTable)
    .orderBy(desc(leaderboardTable.wins))
    .limit(limit);

  const result = entries.map((e) => ({
    id: e.id,
    playerName: e.playerName,
    wins: e.wins,
    losses: e.losses,
    draws: e.draws,
    totalGames: e.totalGames,
    winRate: e.totalGames > 0 ? Math.round((e.wins / e.totalGames) * 100) / 100 : 0,
  }));

  res.json(result);
});

export default router;
