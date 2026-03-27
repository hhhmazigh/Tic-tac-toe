import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { db } from "@workspace/db";
import { roomsTable, leaderboardTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { logger } from "./lib/logger";

type GameMessage =
  | { type: "join"; roomCode: string; playerName: string }
  | { type: "move"; roomCode: string; cellIndex: number; player: string }
  | { type: "restart"; roomCode: string }
  | { type: "ping" };

interface Client {
  ws: WebSocket;
  roomCode: string;
  playerName: string;
  role: "host" | "guest";
}

const clients = new Map<WebSocket, Client>();
const rooms = new Map<string, Set<WebSocket>>();

function broadcast(roomCode: string, data: object, except?: WebSocket) {
  const roomClients = rooms.get(roomCode);
  if (!roomClients) return;
  const json = JSON.stringify(data);
  for (const ws of roomClients) {
    if (ws !== except && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

function broadcastAll(roomCode: string, data: object) {
  const roomClients = rooms.get(roomCode);
  if (!roomClients) return;
  const json = JSON.stringify(data);
  for (const ws of roomClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

function checkWin(board: (string | null)[], boardSize: number, winLength: number): string | null {
  const get = (r: number, c: number) => board[r * boardSize + c];

  const lines: [number, number][][] = [];

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c <= boardSize - winLength; c++) {
      lines.push(Array.from({ length: winLength }, (_, i) => [r, c + i] as [number, number]));
    }
  }
  for (let c = 0; c < boardSize; c++) {
    for (let r = 0; r <= boardSize - winLength; r++) {
      lines.push(Array.from({ length: winLength }, (_, i) => [r + i, c] as [number, number]));
    }
  }
  for (let r = 0; r <= boardSize - winLength; r++) {
    for (let c = 0; c <= boardSize - winLength; c++) {
      lines.push(Array.from({ length: winLength }, (_, i) => [r + i, c + i] as [number, number]));
    }
  }
  for (let r = winLength - 1; r < boardSize; r++) {
    for (let c = 0; c <= boardSize - winLength; c++) {
      lines.push(Array.from({ length: winLength }, (_, i) => [r - i, c + i] as [number, number]));
    }
  }

  for (const line of lines) {
    const [first] = line;
    const val = get(first[0], first[1]);
    if (!val) continue;
    if (line.every(([r, c]) => get(r, c) === val)) return val;
  }
  return null;
}

async function updateLeaderboard(winnerName: string | null, loserName: string | null, isDraw: boolean) {
  const upsert = async (name: string, isWinner: boolean, isLoser: boolean) => {
    const existing = await db.select().from(leaderboardTable).where(eq(leaderboardTable.playerName, name)).limit(1);
    const id = existing.length ? existing[0].id : randomBytes(8).toString("hex");

    if (existing.length) {
      const e = existing[0];
      await db.update(leaderboardTable).set({
        wins: isWinner ? e.wins + 1 : e.wins,
        losses: isLoser ? e.losses + 1 : e.losses,
        draws: isDraw ? e.draws + 1 : e.draws,
        totalGames: e.totalGames + 1,
        updatedAt: new Date(),
      }).where(eq(leaderboardTable.id, id));
    } else {
      await db.insert(leaderboardTable).values({
        id,
        playerName: name,
        wins: isWinner ? 1 : 0,
        losses: isLoser ? 1 : 0,
        draws: isDraw ? 1 : 0,
        totalGames: 1,
      });
    }
  };

  if (isDraw) {
    if (winnerName) await upsert(winnerName, false, false);
    if (loserName) await upsert(loserName, false, false);
  } else {
    if (winnerName) await upsert(winnerName, true, false);
    if (loserName) await upsert(loserName, false, true);
  }
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    ws.on("message", async (raw) => {
      let msg: GameMessage;
      try {
        msg = JSON.parse(raw.toString()) as GameMessage;
      } catch {
        return;
      }

      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }

      if (msg.type === "join") {
        const { roomCode, playerName } = msg;

        const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.roomCode, roomCode)).limit(1);
        if (!roomRows.length) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }

        const room = roomRows[0];
        let role: "host" | "guest" = "guest";

        if (playerName === room.hostName) {
          role = "host";
        } else if (!room.guestName && room.status === "waiting") {
          await db.update(roomsTable).set({ guestName: playerName, status: "playing", updatedAt: new Date() }).where(eq(roomsTable.roomCode, roomCode));
          role = "guest";
        } else if (playerName === room.guestName) {
          role = "guest";
        }

        clients.set(ws, { ws, roomCode, playerName, role });
        if (!rooms.has(roomCode)) rooms.set(roomCode, new Set());
        rooms.get(roomCode)!.add(ws);

        const updated = await db.select().from(roomsTable).where(eq(roomsTable.roomCode, roomCode)).limit(1);
        const state = {
          ...updated[0],
          board: JSON.parse(updated[0].board),
        };

        broadcastAll(roomCode, { type: "state", room: state });
        return;
      }

      if (msg.type === "move") {
        const { roomCode, cellIndex, player } = msg;
        const client = clients.get(ws);
        if (!client) return;

        const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.roomCode, roomCode)).limit(1);
        if (!roomRows.length) return;
        const room = roomRows[0];

        if (room.status !== "playing") return;
        if (room.currentTurn !== player) return;

        const board: (string | null)[] = JSON.parse(room.board);
        if (board[cellIndex] !== null) return;

        board[cellIndex] = player;
        const winner = checkWin(board, room.boardSize, room.winLength);
        const isDraw = !winner && board.every((c) => c !== null);
        const nextTurn = player === "X" ? "O" : "X";

        const updates: Partial<typeof roomsTable.$inferSelect> = {
          board: JSON.stringify(board),
          currentTurn: nextTurn,
          updatedAt: new Date(),
        };

        if (winner) {
          updates.status = "finished";
          updates.winner = player;
        } else if (isDraw) {
          updates.status = "finished";
          updates.winner = "draw";
        }

        await db.update(roomsTable).set(updates).where(eq(roomsTable.roomCode, roomCode));

        if (winner || isDraw) {
          const winnerName = winner ? (player === "X" ? room.hostName : (room.guestName ?? null)) : null;
          const loserName = winner ? (player === "X" ? (room.guestName ?? null) : room.hostName) : null;
          await updateLeaderboard(winnerName, loserName, isDraw).catch((e) => logger.error(e));
        }

        const updated = await db.select().from(roomsTable).where(eq(roomsTable.roomCode, roomCode)).limit(1);
        broadcastAll(roomCode, { type: "state", room: { ...updated[0], board: JSON.parse(updated[0].board) } });
        return;
      }

      if (msg.type === "restart") {
        const { roomCode } = msg;
        const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.roomCode, roomCode)).limit(1);
        if (!roomRows.length) return;
        const room = roomRows[0];

        const emptyBoard = JSON.stringify(Array(room.boardSize * room.boardSize).fill(null));
        await db.update(roomsTable).set({
          board: emptyBoard,
          status: "playing",
          winner: null,
          currentTurn: "X",
          updatedAt: new Date(),
        }).where(eq(roomsTable.roomCode, roomCode));

        const updated = await db.select().from(roomsTable).where(eq(roomsTable.roomCode, roomCode)).limit(1);
        broadcastAll(roomCode, { type: "state", room: { ...updated[0], board: JSON.parse(updated[0].board) } });
      }
    });

    ws.on("close", () => {
      const client = clients.get(ws);
      if (client) {
        const { roomCode, playerName } = client;
        rooms.get(roomCode)?.delete(ws);
        clients.delete(ws);
        broadcast(roomCode, { type: "opponent_left", playerName });
      }
    });
  });

  logger.info("WebSocket server initialized at /api/ws");
}
