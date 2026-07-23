import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const gameConfigTable = sqliteTable("game_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
