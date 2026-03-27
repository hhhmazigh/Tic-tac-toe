import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  board: (string | null)[];
  size: number;
  winningLine: number[] | null;
  onCellClick: (index: number) => void;
  disabled: boolean;
  theme: string;
  symbolX?: string;
  symbolO?: string;
}

const THEME_STYLES: Record<string, {
  boardBg: string;
  gridLine: string;
  cellHover: string;
  symbolX: string;
  symbolO: string;
  winGlow: string;
  winBg: string;
}> = {
  classic: {
    boardBg: "#ffffff",
    gridLine: "#d1d5db",
    cellHover: "rgba(59,130,246,0.07)",
    symbolX: "#1d4ed8",
    symbolO: "#dc2626",
    winGlow: "rgba(22,163,74,0.4)",
    winBg: "rgba(22,163,74,0.12)",
  },
  neon: {
    boardBg: "#0a0a14",
    gridLine: "#a855f7",
    cellHover: "rgba(168,85,247,0.08)",
    symbolX: "#22d3ee",
    symbolO: "#f472b6",
    winGlow: "rgba(74,222,128,0.6)",
    winBg: "rgba(74,222,128,0.12)",
  },
  wood: {
    boardBg: "#3b2008",
    gridLine: "#a16207",
    cellHover: "rgba(217,119,6,0.1)",
    symbolX: "#fbbf24",
    symbolO: "#f97316",
    winGlow: "rgba(134,239,172,0.5)",
    winBg: "rgba(134,239,172,0.12)",
  },
  ice: {
    boardBg: "#0c1a2e",
    gridLine: "#38bdf8",
    cellHover: "rgba(56,189,248,0.08)",
    symbolX: "#67e8f9",
    symbolO: "#bae6fd",
    winGlow: "rgba(255,255,255,0.5)",
    winBg: "rgba(255,255,255,0.1)",
  },
  fire: {
    boardBg: "#1a0505",
    gridLine: "#ef4444",
    cellHover: "rgba(239,68,68,0.08)",
    symbolX: "#fbbf24",
    symbolO: "#f87171",
    winGlow: "rgba(253,224,71,0.6)",
    winBg: "rgba(253,224,71,0.1)",
  },
  space: {
    boardBg: "#050510",
    gridLine: "#6366f1",
    cellHover: "rgba(99,102,241,0.08)",
    symbolX: "#e2e8f0",
    symbolO: "#c4b5fd",
    winGlow: "rgba(250,204,21,0.6)",
    winBg: "rgba(250,204,21,0.1)",
  },
};

function XMark({ color, size }: { color: string; size: number }) {
  const s = Math.min(size * 0.48, 80);
  const stroke = Math.max(s / 8, 6);
  const pad = stroke;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <line
        x1={pad} y1={pad} x2={s - pad} y2={s - pad}
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
      <line
        x1={s - pad} y1={pad} x2={pad} y2={s - pad}
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
}

function OMark({ color, size }: { color: string; size: number }) {
  const s = Math.min(size * 0.48, 80);
  const stroke = Math.max(s / 8, 6);
  const r = s / 2 - stroke;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <circle
        cx={s / 2} cy={s / 2} r={r}
        stroke={color} strokeWidth={stroke}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
}

function CustomMark({ symbol, color, cellSize }: { symbol: string; color: string; cellSize: number }) {
  const fontSize = Math.min(cellSize * 0.44, 72);
  return (
    <span
      style={{
        fontSize,
        color,
        textShadow: `0 0 12px ${color}, 0 0 24px ${color}55`,
        lineHeight: 1,
        display: "block",
        userSelect: "none",
      }}
    >
      {symbol}
    </span>
  );
}

export function GameBoard({
  board, size, winningLine, onCellClick, disabled, theme, symbolX = "X", symbolO = "O"
}: GameBoardProps) {
  const t = THEME_STYLES[theme] ?? THEME_STYLES.neon;

  // Board is sized as a square; clamp to viewport
  const isDefaultX = symbolX === "X";
  const isDefaultO = symbolO === "O";

  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ maxWidth: "min(90vw, 90vh - 260px)", margin: "0 auto" }}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: "1 / 1", maxWidth: 520 }}
      >
        {/* Board background */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: t.boardBg,
            boxShadow: `0 0 40px ${t.winGlow}33, 0 20px 60px rgba(0,0,0,0.5)`,
          }}
        />

        {/* Grid lines overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Vertical lines */}
          {Array.from({ length: size - 1 }, (_, i) => {
            const x = ((i + 1) / size) * 100;
            return (
              <line
                key={`v${i}`}
                x1={x} y1={2} x2={x} y2={98}
                stroke={t.gridLine}
                strokeWidth={0.5}
                opacity={0.6}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {/* Horizontal lines */}
          {Array.from({ length: size - 1 }, (_, i) => {
            const y = ((i + 1) / size) * 100;
            return (
              <line
                key={`h${i}`}
                x1={2} y1={y} x2={98} y2={y}
                stroke={t.gridLine}
                strokeWidth={0.5}
                opacity={0.6}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* Cells grid */}
        <div
          className="absolute inset-0 grid rounded-2xl overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
          }}
        >
          {board.map((cell, i) => {
            const isWin = winningLine?.includes(i);
            const isEmpty = !cell;

            return (
              <motion.button
                key={i}
                onClick={() => onCellClick(i)}
                disabled={!isEmpty || disabled}
                whileHover={isEmpty && !disabled ? { scale: 0.92 } : {}}
                whileTap={isEmpty && !disabled ? { scale: 0.85 } : {}}
                className="relative flex items-center justify-center focus:outline-none"
                style={{
                  background: isWin ? t.winBg : "transparent",
                  cursor: isEmpty && !disabled ? "pointer" : "default",
                  transition: "background 0.3s ease",
                }}
              >
                {/* Hover shimmer */}
                {isEmpty && !disabled && (
                  <div
                    className="absolute inset-1 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200"
                    style={{ background: t.cellHover }}
                  />
                )}

                {/* Win glow pulse */}
                {isWin && (
                  <motion.div
                    className="absolute inset-0 rounded-sm"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ boxShadow: `inset 0 0 20px ${t.winGlow}` }}
                  />
                )}

                {/* Symbol */}
                <AnimatePresence>
                  {cell && (
                    <motion.div
                      initial={{ scale: 0, rotate: cell === symbolX ? -30 : 30, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="relative z-10 flex items-center justify-center"
                    >
                      {cell === symbolX ? (
                        isDefaultX ? (
                          <XMark color={t.symbolX} size={100} />
                        ) : (
                          <CustomMark symbol={symbolX} color={t.symbolX} cellSize={100} />
                        )
                      ) : isDefaultO ? (
                        <OMark color={t.symbolO} size={100} />
                      ) : (
                        <CustomMark symbol={symbolO} color={t.symbolO} cellSize={100} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Winning line strike-through */}
        {winningLine && winningLine.length >= 2 && (
          <WinLine line={winningLine} size={size} color={t.winGlow} />
        )}
      </div>
    </div>
  );
}

function WinLine({ line, size, color }: { line: number[]; size: number; color: string }) {
  const first = line[0];
  const last = line[line.length - 1];

  const toXY = (idx: number) => {
    const col = idx % size;
    const row = Math.floor(idx / size);
    return {
      x: ((col + 0.5) / size) * 100,
      y: ((row + 0.5) / size) * 100,
    };
  };

  const start = toXY(first);
  const end = toXY(last);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.line
        x1={start.x} y1={start.y}
        x2={end.x} y2={end.y}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}
