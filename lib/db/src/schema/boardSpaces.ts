import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const boardSpacesTable = pgTable("board_spaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("property"),
  position: integer("position").notNull(),
  colorGroup: text("color_group"),
  rentValue: integer("rent_value").notNull().default(0),
  propertyValue: integer("property_value").notNull().default(0),
  hasHotel: boolean("has_hotel").notNull().default(false),
  ownerId: integer("owner_id"),
});

export const insertBoardSpaceSchema = createInsertSchema(boardSpacesTable).omit({ id: true });
export type InsertBoardSpace = z.infer<typeof insertBoardSpaceSchema>;
export type BoardSpace = typeof boardSpacesTable.$inferSelect;
