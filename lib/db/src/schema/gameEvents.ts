import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameEventsTable = sqliteTable("game_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  type: text("type").notNull().default("system"),
  teamId: integer("team_id"),
  amount: integer("amount"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertGameEventSchema = createInsertSchema(gameEventsTable).omit({ id: true, createdAt: true });
export type InsertGameEvent = z.infer<typeof insertGameEventSchema>;
export type GameEvent = typeof gameEventsTable.$inferSelect;
