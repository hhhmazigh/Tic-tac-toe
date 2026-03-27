import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import { User, Bot, RotateCcw, ArrowLeft, Trophy, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { checkWin, getBestMove } from "@/lib/game-logic";
import { GameBoard } from "@/components/game/game-board";
import { Button, Card, Dialog } from "@/components/ui/core";
import { useGetRoom } from "@workspace/api-client-react";
import { useWebSocket } from "@/hooks/use-websocket";

export default function GamePage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const roomCode = searchParams.get("room");
  
  const { settings } = useAppStore();
  
  // Game State
  const [board, setBoard] = useState<(string | null)[]>(Array(settings.boardSize * settings.boardSize).fill(null));
  const [currentTurn, setCurrentTurn] = useState<string>(settings.symbolX);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  // Online specific state
  const { data: roomData, isLoading: roomLoading } = useGetRoom(roomCode || "", { query: { enabled: !!roomCode }});
  
  // WebSockets setup
  const wsUrl = roomCode ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws?roomCode=${roomCode}&playerName=${encodeURIComponent(settings.hostName)}` : null;
  const { connected, emit, on } = useWebSocket(wsUrl);

  const isOnline = !!roomCode;
  const isMyTurnOnline = isOnline && roomData?.currentTurn === (roomData?.hostName === settings.hostName ? 'X' : 'O');
  
  const resetGame = useCallback(() => {
    setBoard(Array(settings.boardSize * settings.boardSize).fill(null));
    setCurrentTurn(settings.symbolX);
    setWinner(null);
    setWinningLine(null);
    setIsDraw(false);
  }, [settings.boardSize, settings.symbolX]);

  // Handle Win/Draw state changes
  useEffect(() => {
    if (winner || isDraw) {
      if (winner) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#a855f7', '#06b6d4', '#ec4899'] });
        setScores(s => ({
          ...s,
          [winner === settings.symbolX ? 'p1' : 'p2']: s[winner === settings.symbolX ? 'p1' : 'p2'] + 1
        }));
      }
    }
  }, [winner, isDraw, settings.symbolX]);

  // Handle local AI move
  useEffect(() => {
    if (!isOnline && settings.mode === 'ai' && currentTurn === settings.symbolO && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const aiMove = getBestMove(board, settings.boardSize, settings.winLength, settings.symbolO, settings.symbolX, settings.aiDifficulty);
        if (aiMove !== -1) {
          handleMove(aiMove, settings.symbolO);
        }
      }, 600); // Artificial delay for effect
      return () => clearTimeout(timer);
    }
  }, [currentTurn, board, winner, isDraw, isOnline, settings]);

  // Online Syncing
  useEffect(() => {
    if (isOnline && roomData) {
      // Sync initial state if available
      if (roomData.board) setBoard(roomData.board);
      // Wait, API might not map perfectly. 
      // In a real app we would sync state fully here.
    }
  }, [isOnline, roomData]);

  useEffect(() => {
    on('STATE_UPDATE', (data: any) => {
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      if (data.winner) setWinner(data.winner);
    });
  }, [on]);

  const handleMove = (index: number, forcedSymbol?: string) => {
    if (board[index] || winner || isDraw) return;
    if (isOnline && !isMyTurnOnline) return;

    const symbolToPlace = forcedSymbol || currentTurn;
    const newBoard = [...board];
    newBoard[index] = symbolToPlace;
    
    setBoard(newBoard);
    
    const winResult = checkWin(newBoard, settings.boardSize, settings.winLength);
    if (winResult.winner) {
      setWinner(winResult.winner);
      setWinningLine(winResult.line);
    } else if (winResult.isDraw) {
      setIsDraw(true);
    } else {
      setCurrentTurn(currentTurn === settings.symbolX ? settings.symbolO : settings.symbolX);
    }

    if (isOnline) {
      emit('MOVE', { index, symbol: symbolToPlace });
    }
  };

  const currentTheme = isOnline ? (roomData?.theme || settings.theme) : settings.theme;

  return (
    <div className={`min-h-screen pt-20 pb-6 px-4 flex flex-col items-center theme-${currentTheme}`}>
      {/* Top Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => setLocation('/')} className="gap-2 text-muted-foreground hover:text-foreground text-sm px-2">
          <ArrowLeft className="w-4 h-4" /> Menu
        </Button>
        {isOnline && (
          <div className="flex items-center gap-3 bg-secondary/50 px-3 py-1.5 rounded-full border border-border text-xs">
            <span className="font-mono text-muted-foreground">ROOM: <strong className="text-primary tracking-widest">{roomCode}</strong></span>
            {connected ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-destructive" />}
          </div>
        )}
      </div>

      {/* Scoreboard — compact horizontal strip */}
      <div className="flex items-stretch justify-center gap-3 mb-4 w-full max-w-2xl">
        {/* Player X */}
        <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
          currentTurn === settings.symbolX
            ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_14px_rgba(34,211,238,0.2)]'
            : 'border-white/10 bg-white/5'
        }`}>
          <div className="text-xl font-display font-black" style={{ color: '#22d3ee', textShadow: '0 0 10px #22d3ee88' }}>
            {settings.symbolX}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wider">{settings.hostName}</span>
            <span className="text-lg font-display font-bold text-foreground leading-none">{scores.p1}</span>
          </div>
          {currentTurn === settings.symbolX && !winner && !isDraw && (
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="ml-auto w-2 h-2 rounded-full bg-cyan-400" />
          )}
        </div>

        {/* VS */}
        <div className="flex items-center justify-center px-2 text-sm font-display font-bold text-muted-foreground">VS</div>

        {/* Player O */}
        <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
          currentTurn === settings.symbolO
            ? 'border-pink-400/60 bg-pink-400/10 shadow-[0_0_14px_rgba(244,114,182,0.2)]'
            : 'border-white/10 bg-white/5'
        }`}>
          <div className="text-xl font-display font-black" style={{ color: '#f472b6', textShadow: '0 0 10px #f472b688' }}>
            {settings.symbolO}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wider flex items-center gap-1">
              {isOnline ? roomData?.guestName || 'Waiting…' : settings.mode === 'ai' ? `AI · ${settings.aiDifficulty}` : 'Player 2'}
              {settings.mode === 'ai' && <Bot className="w-3 h-3" />}
            </span>
            <span className="text-lg font-display font-bold text-foreground leading-none">{scores.p2}</span>
          </div>
          {currentTurn === settings.symbolO && !winner && !isDraw && (
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="ml-auto w-2 h-2 rounded-full bg-pink-400" />
          )}
        </div>
      </div>

      {/* Main Game Board */}
      <GameBoard 
        board={board} 
        size={settings.boardSize} 
        winningLine={winningLine}
        onCellClick={(i) => handleMove(i)}
        disabled={!!winner || isDraw || (isOnline && !isMyTurnOnline)}
        theme={currentTheme}
        symbolX={settings.symbolX}
        symbolO={settings.symbolO}
      />

      {/* Game Over Dialog */}
      <Dialog open={!!winner || isDraw} onOpenChange={() => {}}>
        <Card className="p-8 text-center bg-background/95 border-primary shadow-primary/20 shadow-2xl">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-4xl font-display font-bold uppercase tracking-wider mb-2">
            {winner ? `${winner === settings.symbolX ? settings.hostName : (settings.mode === 'ai' ? 'AI' : 'Player 2')} Wins!` : "It's a Draw!"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {winner ? `Outstanding performance.` : `A battle of equals.`}
          </p>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setLocation('/')}>Menu</Button>
            <Button variant="glow" className="flex-1 gap-2" onClick={resetGame}>
              <RotateCcw className="w-4 h-4" /> Play Again
            </Button>
          </div>
        </Card>
      </Dialog>
    </div>
  );
}
