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

// Property positions grouped by board side (excluding corners, chance, tax)
const SIDE_POSITIONS = {
  bottom: [1, 2, 4, 6, 7],
  left:   [9, 10, 12, 14, 15],
  top:    [17, 18, 19, 22, 23],
  right:  [25, 26, 28, 30, 31],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.post("/game/scatter", async (req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.id);
  if (teams.length === 0) {
    res.status(400).json({ error: "No teams found" });
    return;
  }

  // Shuffle teams and pick 3 random positions per side
  const shuffledTeams = shuffle(teams);
  const sides = [
    shuffle(SIDE_POSITIONS.bottom).slice(0, 3),
    shuffle(SIDE_POSITIONS.left).slice(0, 3),
    shuffle(SIDE_POSITIONS.top).slice(0, 3),
    shuffle(SIDE_POSITIONS.right).slice(0, 3),
  ];
  const allPositions = sides.flat();

  const assignments: Array<{ teamId: number; teamName: string; position: number }> = [];

  for (let i = 0; i < shuffledTeams.length; i++) {
    const team = shuffledTeams[i];
    const position = allPositions[i % allPositions.length];
    await db.update(teamsTable).set({ position }).where(eq(teamsTable.id, team.id));
    assignments.push({ teamId: team.id, teamName: team.name, position });
  }

  const boardSpaces = await db.select().from(boardSpacesTable);
  const spaceName = (pos: number) => boardSpaces.find(s => s.position === pos)?.name ?? `pos ${pos}`;

  await db.insert(gameEventsTable).values({
    message: "🎲 Game started! Teams have been scattered to their starting positions.",
    type: "system",
  });

  for (const a of assignments) {
    await db.insert(gameEventsTable).values({
      message: `${a.teamName} starts at ${spaceName(a.position)}`,
      type: "system",
      teamId: a.teamId,
    });
  }

  res.json({ success: true, assignments: assignments.map(a => ({ ...a, spaceName: spaceName(a.position) })) });
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
  await db.insert(gameEventsTable).values({ message: "Welcome to Monopoly for Yew! Game has been reset. Get ready!", type: "system" });
  res.json({ success: true, message: "Game reset to initial state" });
});

export default router;
