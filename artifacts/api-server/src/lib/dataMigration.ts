import { eq } from "drizzle-orm";
import { db, boardSpacesTable, teamsTable } from "@workspace/db";
import { logger } from "./logger";

const BOARD_CORRECTIONS: Array<{
  position: number;
  name: string;
  colorGroup?: string | null;
}> = [
  { position: 9,  name: "CCDD (5F)",               colorGroup: "pink"  },
  { position: 12, name: "Science Lab B303 (3F)",    colorGroup: "pink"  },
  { position: 17, name: "Innovation Hub (2F)",      colorGroup: "red"   },
  { position: 21, name: "ELW Trip"                                       },
  { position: 25, name: "Swimming Pool (4F)",       colorGroup: "green" },
  { position: 26, name: "CUGO (5F)",                colorGroup: "green" },
  { position: 28, name: "Lecture Hall 1 (4F)",      colorGroup: "green" },
  { position: 29, name: "School Supplies"                                },
];

const TEAM_CORRECTIONS: Array<{
  id: number;
  name: string;
  color: string;
}> = [
  { id: 1, name: "Sabretooth", color: "#f5a623" },
  { id: 4, name: "Dragon",     color: "#e74c3c" },
  { id: 5, name: "Panda",      color: "#87ceeb" },
  { id: 6, name: "Tiger",      color: "#8e44ad" },
  { id: 7, name: "Rooster",    color: "#2ecc71" },
  { id: 8, name: "Lion",       color: "#f1c40f" },
];

export async function runDataMigration(): Promise<void> {
  try {
    for (const fix of BOARD_CORRECTIONS) {
      const update: Partial<typeof boardSpacesTable.$inferSelect> = { name: fix.name };
      if (fix.colorGroup !== undefined) update.colorGroup = fix.colorGroup;
      await db
        .update(boardSpacesTable)
        .set(update)
        .where(eq(boardSpacesTable.position, fix.position));
    }

    for (const fix of TEAM_CORRECTIONS) {
      await db
        .update(teamsTable)
        .set({ name: fix.name, color: fix.color })
        .where(eq(teamsTable.id, fix.id));
    }

    logger.info("Data migration complete");
  } catch (err) {
    logger.error({ err }, "Data migration failed");
  }
}
