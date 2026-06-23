import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, teamsTable, boardSpacesTable, gameEventsTable, gameConfigTable } from "@workspace/db";

const router: IRouter = Router();

async function computeNetWorth(teamId: number, cash: number, allSpaces: typeof boardSpacesTable.$inferSelect[]) {
  const owned = allSpaces.filter(s => s.ownerId === teamId);
  const propertyValue = owned.reduce((sum, s) => sum + s.propertyValue + (s.hasHotel ? 100 : 0), 0);
  const propertyCount = owned.length;

  const colorCounts: Record<string, number> = {};
  const colorTotals: Record<string, number> = {};
  for (const space of owned) {
    if (space.colorGroup) colorCounts[space.colorGroup] = (colorCounts[space.colorGroup] ?? 0) + 1;
  }
  for (const space of allSpaces) {
    if (space.colorGroup) colorTotals[space.colorGroup] = (colorTotals[space.colorGroup] ?? 0) + 1;
  }

  let setBonus = 0;
  for (const [color, count] of Object.entries(colorCounts)) {
    if (colorTotals[color] && count >= colorTotals[color]) setBonus += 200;
  }

  return { netWorth: cash + propertyValue + setBonus, propertyCount, propertyValue, setBonus };
}

router.get("/game/state", async (req, res): Promise<void> => {
  const [teams, allSpaces, recentEvents, configs] = await Promise.all([
    db.select().from(teamsTable).orderBy(teamsTable.id),
    db.select().from(boardSpacesTable).orderBy(boardSpacesTable.position),
    db.select().from(gameEventsTable).orderBy(desc(gameEventsTable.createdAt)).limit(15),
    db.select().from(gameConfigTable),
  ]);

  const roundConfig = configs.find(c => c.key === "round");
  const statusConfig = configs.find(c => c.key === "status");

  const teamsWithStats = await Promise.all(
    teams.map(async (t) => {
      const { netWorth, propertyCount } = await computeNetWorth(t.id, t.cash, allSpaces);
      return { ...t, netWorth, propertyCount, createdAt: t.createdAt.toISOString() };
    })
  );

  const boardWithOwners = await Promise.all(
    allSpaces.map(async (space) => {
      let ownerName = null, ownerColor = null, ownerEmoji = null;
      if (space.ownerId) {
        const owner = teams.find(t => t.id === space.ownerId);
        if (owner) { ownerName = owner.name; ownerColor = owner.color; ownerEmoji = owner.emoji; }
      }
      return { ...space, colorGroup: space.colorGroup ?? null, ownerId: space.ownerId ?? null, ownerName, ownerColor, ownerEmoji };
    })
  );

  const eventsWithTeams = await Promise.all(
    recentEvents.map(async (e) => {
      let teamName = null, teamEmoji = null;
      if (e.teamId) {
        const team = teams.find(t => t.id === e.teamId);
        if (team) { teamName = team.name; teamEmoji = team.emoji; }
      }
      return { ...e, teamId: e.teamId ?? null, amount: e.amount ?? null, teamName, teamEmoji, createdAt: e.createdAt.toISOString() };
    })
  );

  res.json({
    teams: teamsWithStats,
    board: boardWithOwners,
    recentEvents: eventsWithTeams,
    round: parseInt(roundConfig?.value ?? "0", 10),
    status: (statusConfig?.value ?? "lobby") as "lobby" | "active" | "finished",
  });
});

router.get("/game/leaderboard", async (req, res): Promise<void> => {
  const [teams, allSpaces] = await Promise.all([
    db.select().from(teamsTable).orderBy(teamsTable.id),
    db.select().from(boardSpacesTable),
  ]);

  const entries = await Promise.all(
    teams.map(async (t) => {
      const { netWorth, propertyCount, propertyValue, setBonus } = await computeNetWorth(t.id, t.cash, allSpaces);
      return { teamId: t.id, teamName: t.name, teamEmoji: t.emoji, teamColor: t.color, cash: t.cash, propertyValue, setBonus, netWorth, propertyCount };
    })
  );

  const sorted = entries.sort((a, b) => b.netWorth - a.netWorth).map((e, i) => ({ ...e, rank: i + 1 }));
  res.json(sorted);
});

router.post("/game/reset", async (req, res): Promise<void> => {
  await db.update(teamsTable).set({ cash: 1500, position: 0 });
  await db.update(boardSpacesTable).set({ ownerId: null, hasHotel: false });
  await db.delete(gameEventsTable);
  await db.delete(gameConfigTable);
  await db.insert(gameConfigTable).values([
    { key: "round", value: "0" },
    { key: "status", value: "lobby" },
  ]);
  await db.insert(gameEventsTable).values({ message: "Welcome to the Staff Monopoly Scavenger Hunt! Game has been reset. Get ready!", type: "system" });
  res.json({ success: true, message: "Game reset to initial state" });
});

export default router;
