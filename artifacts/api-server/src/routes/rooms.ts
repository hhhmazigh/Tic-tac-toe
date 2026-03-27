import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { roomsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateRoomBody, GetRoomParams } from "@workspace/api-zod";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateRoomCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

function generateId(): string {
  return randomBytes(8).toString("hex");
}

function parseRoom(room: typeof roomsTable.$inferSelect) {
  return {
    ...room,
    board: JSON.parse(room.board) as (string | null)[],
    guestName: room.guestName ?? null,
    winner: room.winner ?? null,
    timeLimit: room.timeLimit ?? null,
  };
}

router.post("/rooms", async (req, res) => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const boardSize = data.boardSize ?? 3;
  const board = JSON.stringify(Array(boardSize * boardSize).fill(null));
  const roomCode = generateRoomCode();
  const id = generateId();

  const [room] = await db
    .insert(roomsTable)
    .values({
      id,
      roomCode,
      hostName: data.hostName,
      boardSize,
      winLength: data.winLength ?? 3,
      timeLimit: data.timeLimit ?? null,
      symbolX: data.symbolX ?? "X",
      symbolO: data.symbolO ?? "O",
      theme: data.theme ?? "classic",
      status: "waiting",
      board,
      currentTurn: "X",
    })
    .returning();

  res.status(201).json(parseRoom(room));
});

router.get("/rooms/:roomCode", async (req, res) => {
  const parsed = GetRoomParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid room code" });
    return;
  }

  const room = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.roomCode, parsed.data.roomCode))
    .limit(1);

  if (!room.length) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.json(parseRoom(room[0]));
});

export default router;
