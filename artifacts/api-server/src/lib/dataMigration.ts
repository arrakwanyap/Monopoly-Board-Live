import { eq } from "drizzle-orm";
import { db, boardSpacesTable, teamsTable } from "@workspace/db";
import { logger } from "./logger";

/** Canonical property values — applied on every boot so prod stays in sync */
const VALUE_CORRECTIONS: Array<{ position: number; rentValue: number; propertyValue: number }> = [
  { position:  1, rentValue:  30, propertyValue:  30 }, // Lost & Found Area
  { position:  2, rentValue:  20, propertyValue:  20 }, // Flagpole Garden
  { position:  4, rentValue:  40, propertyValue:  40 }, // Snack Bar
  { position:  6, rentValue:  50, propertyValue:  50 }, // Nurse Office
  { position:  7, rentValue:  60, propertyValue:  60 }, // Back Entry Guard Booth
  { position:  9, rentValue:  70, propertyValue:  70 }, // CCDD
  { position: 10, rentValue:  80, propertyValue:  80 }, // Staff Canteen
  { position: 12, rentValue:  90, propertyValue:  90 }, // Science Lab B303
  { position: 14, rentValue: 100, propertyValue: 100 }, // Art Room (orange)
  { position: 15, rentValue: 120, propertyValue: 120 }, // MSP Room (orange)
  { position: 17, rentValue: 150, propertyValue: 150 }, // Innovation Hub
  { position: 18, rentValue: 130, propertyValue: 130 }, // Madam Tsang
  { position: 19, rentValue: 140, propertyValue: 140 }, // Student Support Service
  { position: 22, rentValue: 160, propertyValue: 160 }, // Student Canteen
  { position: 23, rentValue: 170, propertyValue: 170 }, // Gymnasium
  { position: 25, rentValue: 210, propertyValue: 210 }, // Swimming Pool
  { position: 26, rentValue: 190, propertyValue: 190 }, // CUGO
  { position: 28, rentValue: 200, propertyValue: 200 }, // Lecture Hall 1
  { position: 30, rentValue: 250, propertyValue: 250 }, // Covered Playground
  { position: 31, rentValue: 400, propertyValue: 400 }, // Auditorium
];

/** Fee tile rent values — $200 each, applied on every boot */
const TAX_CORRECTIONS: Array<{ position: number; rentValue: number }> = [
  { position:  3, rentValue: 200 }, // Co-Curricular Activity Fees
  { position: 13, rentValue: 200 }, // School Fees
  { position: 21, rentValue: 200 }, // ELW Trip
  { position: 29, rentValue: 200 }, // School Supplies
];

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
    for (const fix of VALUE_CORRECTIONS) {
      await db
        .update(boardSpacesTable)
        .set({ rentValue: fix.rentValue, propertyValue: fix.propertyValue })
        .where(eq(boardSpacesTable.position, fix.position));
    }

    for (const fix of TAX_CORRECTIONS) {
      await db
        .update(boardSpacesTable)
        .set({ rentValue: fix.rentValue })
        .where(eq(boardSpacesTable.position, fix.position));
    }

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
