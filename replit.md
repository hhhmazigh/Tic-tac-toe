# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Mazigh's Tic Tac Toe — a feature-rich game with AI, local multiplayer, and online multiplayer with real-time WebSocket support.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + ws (WebSockets)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite, Tailwind CSS, Zustand, Framer Motion

## Features

- VS AI: Easy / Medium / Hard / Unbeatable (minimax)
- Pass & Play: local 2-player on same device
- Online Multiplayer: real-time via WebSocket, room codes
- Customization: board size (3×3 to 10×10), win length, symbols, theme (Classic/Neon/Wood/Ice/Fire/Space), turn timer
- Leaderboard: tracks wins/losses/draws for online games
- Creator tag: "Created by Mazigh"

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server with WebSocket
│   └── tictactoe/          # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## DB Schema

- `rooms` — online multiplayer game rooms
- `leaderboard` — player win/loss/draw stats

## API Routes

- `GET /api/healthz` — health check
- `POST /api/rooms` — create a game room
- `GET /api/rooms/:roomCode` — get room state
- `GET /api/leaderboard` — get top players
- `WS /api/ws?roomCode=...&playerName=...` — real-time game WebSocket

## Deployment

Designed for Render.com deployment. The API server reads `PORT` env var. Frontend is a static Vite build.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
