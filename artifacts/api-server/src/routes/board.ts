import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, boardSpacesTable, teamsTable } from "@workspace/db";
import {
  SetBoardSpaceOwnershipParams,
  SetBoardSpaceOwnershipBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichSpace(space: typeof boardSpacesTable.$inferSelect) {
  let ownerName: string | null = null;
  let ownerColor: string | null = null;
  let ownerEmoji: string | null = null;
  if (space.ownerId) {
    const [owner] = await db.select().from(teamsTable).where(eq(teamsTable.id, space.ownerId));
    if (owner) {
      ownerName = owner.name;
      ownerColor = owner.color;
      ownerEmoji = owner.emoji;
    }
  }
  return {
    ...space,
    colorGroup: space.colorGroup ?? null,
    ownerId: space.ownerId ?? null,
    ownerName,
    ownerColor,
    ownerEmoji,
  };
}

router.get("/board", async (req, res): Promise<void> => {
  const spaces = await db.select().from(boardSpacesTable).orderBy(boardSpacesTable.position);
  const result = await Promise.all(spaces.map(enrichSpace));
  res.json(result);
});

router.put("/board/:id/ownership", async (req, res): Promise<void> => {
  const params = SetBoardSpaceOwnershipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SetBoardSpaceOwnershipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch current state so we can detect hotel transitions
  const [current] = await db.select().from(boardSpacesTable).where(eq(boardSpacesTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Board space not found" });
    return;
  }

  const wasHotel = current.hasHotel ?? false;
  const isNowHotel = parsed.data.hasHotel ?? false;

  const updateData: Partial<typeof boardSpacesTable.$inferInsert> = {
    ownerId: parsed.data.ownerId ?? null,
    hasHotel: isNowHotel,
  };

  // Hotel built → add $50 to both rent and displayed price
  if (isNowHotel && !wasHotel) {
    updateData.rentValue    = (current.rentValue    ?? 0) + 50;
    updateData.propertyValue = (current.propertyValue ?? 0) + 50;
  }
  // Hotel removed → subtract $50 (e.g. correction via Board tab)
  if (!isNowHotel && wasHotel) {
    updateData.rentValue    = Math.max(0, (current.rentValue    ?? 0) - 50);
    updateData.propertyValue = Math.max(0, (current.propertyValue ?? 0) - 50);
  }

  const [space] = await db
    .update(boardSpacesTable)
    .set(updateData)
    .where(eq(boardSpacesTable.id, params.data.id))
    .returning();

  res.json(await enrichSpace(space));
});

export default router;
