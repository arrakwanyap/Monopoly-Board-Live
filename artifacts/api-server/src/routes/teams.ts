import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, teamsTable, boardSpacesTable } from "@workspace/db";
import {
  CreateTeamBody,
  UpdateTeamBody,
  UpdateTeamParams,
  GetTeamParams,
  DeleteTeamParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function computeNetWorth(teamId: number, cash: number): Promise<{ netWorth: number; propertyCount: number }> {
  const owned = await db
    .select()
    .from(boardSpacesTable)
    .where(eq(boardSpacesTable.ownerId, teamId));

  const propertyValue = owned.reduce((sum, s) => sum + s.propertyValue + (s.hasHotel ? 100 : 0), 0);
  const propertyCount = owned.length;

  const colorCounts: Record<string, number> = {};
  const colorTotals: Record<string, number> = {};
  for (const space of owned) {
    if (space.colorGroup) {
      colorCounts[space.colorGroup] = (colorCounts[space.colorGroup] ?? 0) + 1;
    }
  }

  const allSpaces = await db.select().from(boardSpacesTable);
  for (const space of allSpaces) {
    if (space.colorGroup) {
      colorTotals[space.colorGroup] = (colorTotals[space.colorGroup] ?? 0) + 1;
    }
  }

  let setBonus = 0;
  for (const [color, count] of Object.entries(colorCounts)) {
    if (colorTotals[color] && count >= colorTotals[color]) {
      setBonus += 200;
    }
  }

  return { netWorth: cash + propertyValue + setBonus, propertyCount };
}

router.get("/teams", async (req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.id);
  const result = await Promise.all(
    teams.map(async (t) => {
      const { netWorth, propertyCount } = await computeNetWorth(t.id, t.cash);
      return { ...t, netWorth, propertyCount, createdAt: t.createdAt.toISOString() };
    })
  );
  res.json(result);
});

router.post("/teams", async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [team] = await db.insert(teamsTable).values(parsed.data).returning();
  const { netWorth, propertyCount } = await computeNetWorth(team.id, team.cash);
  res.status(201).json({ ...team, netWorth, propertyCount, createdAt: team.createdAt.toISOString() });
});

router.get("/teams/:id", async (req, res): Promise<void> => {
  const params = GetTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const { netWorth, propertyCount } = await computeNetWorth(team.id, team.cash);
  res.json({ ...team, netWorth, propertyCount, createdAt: team.createdAt.toISOString() });
});

router.patch("/teams/:id", async (req, res): Promise<void> => {
  const params = UpdateTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [team] = await db
    .update(teamsTable)
    .set(parsed.data)
    .where(eq(teamsTable.id, params.data.id))
    .returning();
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const { netWorth, propertyCount } = await computeNetWorth(team.id, team.cash);
  res.json({ ...team, netWorth, propertyCount, createdAt: team.createdAt.toISOString() });
});

router.delete("/teams/:id", async (req, res): Promise<void> => {
  const params = DeleteTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.update(boardSpacesTable).set({ ownerId: null }).where(eq(boardSpacesTable.ownerId, params.data.id));
  const [team] = await db.delete(teamsTable).where(eq(teamsTable.id, params.data.id)).returning();
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
