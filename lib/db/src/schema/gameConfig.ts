import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const gameConfigTable = pgTable("game_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
