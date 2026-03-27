import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: text("id").primaryKey(),
  roomCode: text("room_code").notNull().unique(),
  hostName: text("host_name").notNull(),
  guestName: text("guest_name"),
  boardSize: integer("board_size").notNull().default(3),
  winLength: integer("win_length").notNull().default(3),
  timeLimit: integer("time_limit"),
  symbolX: text("symbol_x").notNull().default("X"),
  symbolO: text("symbol_o").notNull().default("O"),
  theme: text("theme").notNull().default("classic"),
  status: text("status").notNull().default("waiting"),
  board: text("board").notNull().default("[]"),
  currentTurn: text("current_turn").notNull().default("X"),
  winner: text("winner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
