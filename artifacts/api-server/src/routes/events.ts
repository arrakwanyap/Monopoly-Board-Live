import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, gameEventsTable, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateEventBody, ListEventsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events", async (req, res): Promise<void> => {
  const query = ListEventsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 30) : 30;

  const events = await db
    .select()
    .from(gameEventsTable)
    .orderBy(desc(gameEventsTable.createdAt))
    .limit(limit);

  const result = await Promise.all(
    events.map(async (e) => {
      let teamName: string | null = null;
      let teamEmoji: string | null = null;
      if (e.teamId) {
        const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, e.teamId));
        if (team) {
          teamName = team.name;
          teamEmoji = team.emoji;
        }
      }
      return {
        ...e,
        teamId: e.teamId ?? null,
        amount: e.amount ?? null,
        teamName,
        teamEmoji,
        createdAt: e.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.insert(gameEventsTable).values(parsed.data).returning();

  let teamName: string | null = null;
  let teamEmoji: string | null = null;
  if (event.teamId) {
    const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, event.teamId));
    if (team) {
      teamName = team.name;
      teamEmoji = team.emoji;
    }
  }

  res.status(201).json({
    ...event,
    teamId: event.teamId ?? null,
    amount: event.amount ?? null,
    teamName,
    teamEmoji,
    createdAt: event.createdAt.toISOString(),
  });
});

export default router;
