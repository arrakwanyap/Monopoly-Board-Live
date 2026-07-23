import { db, boardSpacesTable, teamsTable } from "@workspace/db";
import { logger } from "./logger";

const BOARD_SPACES = [
  // ── Corners ────────────────────────────────────────────────────────────
  { position:  0, name: "GO",             type: "corner",   colorGroup: null, rentValue: 0,   propertyValue: 0   },
  { position:  8, name: "Jail",           type: "corner",   colorGroup: null, rentValue: 0,   propertyValue: 0   },
  { position: 16, name: "Free Parking",   type: "corner",   colorGroup: null, rentValue: 0,   propertyValue: 0   },
  { position: 24, name: "Go To Jail",     type: "corner",   colorGroup: null, rentValue: 0,   propertyValue: 0   },

  // ── Bottom row (1–7) ───────────────────────────────────────────────────
  { position:  1, name: "Lost & Found Area",       type: "property", colorGroup: "brown",      rentValue:  30, propertyValue:  30 },
  { position:  2, name: "Flagpole Garden",          type: "property", colorGroup: "brown",      rentValue:  20, propertyValue:  20 },
  { position:  3, name: "Co-Curricular Activity Fees", type: "tax",  colorGroup: null,          rentValue: 200, propertyValue:   0 },
  { position:  4, name: "Snack Bar",                type: "property", colorGroup: "light_blue", rentValue:  40, propertyValue:  40 },
  { position:  5, name: "Chance",                   type: "chance",   colorGroup: null,          rentValue:   0, propertyValue:   0 },
  { position:  6, name: "Nurse Office",             type: "property", colorGroup: "light_blue", rentValue:  50, propertyValue:  50 },
  { position:  7, name: "Back Entry Guard Booth",   type: "property", colorGroup: "light_blue", rentValue:  60, propertyValue:  60 },

  // ── Left column (9–15) ─────────────────────────────────────────────────
  { position:  9, name: "CCDD",                     type: "property", colorGroup: "pink",       rentValue:  70, propertyValue:  70 },
  { position: 10, name: "Staff Canteen",             type: "property", colorGroup: "pink",       rentValue:  80, propertyValue:  80 },
  { position: 11, name: "Chance",                   type: "chance",   colorGroup: null,          rentValue:   0, propertyValue:   0 },
  { position: 12, name: "Science Lab B303",          type: "property", colorGroup: "pink",       rentValue:  90, propertyValue:  90 },
  { position: 13, name: "School Fees",               type: "tax",      colorGroup: null,          rentValue: 200, propertyValue:   0 },
  { position: 14, name: "Art Room",                  type: "property", colorGroup: "orange",     rentValue: 100, propertyValue: 100 },
  { position: 15, name: "MSP Room",                  type: "property", colorGroup: "orange",     rentValue: 120, propertyValue: 120 },

  // ── Top row (17–23) ────────────────────────────────────────────────────
  { position: 17, name: "Innovation Hub",            type: "property", colorGroup: "red",        rentValue: 150, propertyValue: 150 },
  { position: 18, name: "Madam Tsang",               type: "property", colorGroup: "red",        rentValue: 130, propertyValue: 130 },
  { position: 19, name: "Student Support Service",   type: "property", colorGroup: "red",        rentValue: 140, propertyValue: 140 },
  { position: 20, name: "Chance",                   type: "chance",   colorGroup: null,          rentValue:   0, propertyValue:   0 },
  { position: 21, name: "ELW Trip",                  type: "tax",      colorGroup: null,          rentValue: 200, propertyValue:   0 },
  { position: 22, name: "Student Canteen",           type: "property", colorGroup: "yellow",     rentValue: 160, propertyValue: 160 },
  { position: 23, name: "Gymnasium",                 type: "property", colorGroup: "yellow",     rentValue: 170, propertyValue: 170 },

  // ── Right column (25–31) ───────────────────────────────────────────────
  { position: 25, name: "Swimming Pool",             type: "property", colorGroup: "green",      rentValue: 210, propertyValue: 210 },
  { position: 26, name: "CUGO",                      type: "property", colorGroup: "green",      rentValue: 190, propertyValue: 190 },
  { position: 27, name: "Chance",                   type: "chance",   colorGroup: null,          rentValue:   0, propertyValue:   0 },
  { position: 28, name: "Lecture Hall 1",            type: "property", colorGroup: "green",      rentValue: 200, propertyValue: 200 },
  { position: 29, name: "School Supplies",           type: "tax",      colorGroup: null,          rentValue: 200, propertyValue:   0 },
  { position: 30, name: "Covered Playground",        type: "property", colorGroup: "dark_blue",  rentValue: 250, propertyValue: 250 },
  { position: 31, name: "Auditorium",                type: "property", colorGroup: "dark_blue",  rentValue: 400, propertyValue: 400 },
];

const TEAMS = [
  { name: "Sabretooth", color: "#f5a623", emoji: "/team_sabretooth.png", cash: 1500, position: 0 },
  { name: "Phoenix",    color: "#e74c3c", emoji: "/team_phoenix.png",    cash: 1500, position: 0 },
  { name: "Unicorn",    color: "#2980b9", emoji: "/team_unicorn.png",    cash: 1500, position: 0 },
  { name: "Dragon",     color: "#e74c3c", emoji: "/team_dragon.png",     cash: 1500, position: 0 },
  { name: "Panda",      color: "#87ceeb", emoji: "/team_panda.png",      cash: 1500, position: 0 },
  { name: "Tiger",      color: "#8e44ad", emoji: "/team_tiger.png",      cash: 1500, position: 0 },
  { name: "Rooster",    color: "#2ecc71", emoji: "/team_rooster.png",    cash: 1500, position: 0 },
  { name: "Lion",       color: "#f1c40f", emoji: "/team_lion.png",       cash: 1500, position: 0 },
];

export async function seedIfEmpty(): Promise<void> {
  try {
    const existingSpaces = await db.select().from(boardSpacesTable).limit(1);
    if (existingSpaces.length > 0) {
      logger.info("Database already seeded — skipping");
      return;
    }

    logger.info("Empty database detected — seeding board spaces and teams...");

    await db.insert(boardSpacesTable).values(BOARD_SPACES);
    await db.insert(teamsTable).values(TEAMS);

    logger.info("Seed complete: 32 board spaces + 8 teams inserted");
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}
