import { useState } from "react";
import { useLocation } from "wouter";
import { useAppStore, GameSettings } from "@/lib/store";
import { Button, Input, Label, Card } from "@/components/ui/core";
import { Settings2, Play, Users } from "lucide-react";
import { useCreateRoom } from "@workspace/api-client-react";

export function SetupForm({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
  const [_, setLocation] = useLocation();
  const { settings, updateSettings } = useAppStore();
  const [roomCodeInput, setRoomCodeInput] = useState("");
  
  const createRoomMut = useCreateRoom();

  const handleStart = async () => {
    if (settings.mode === 'online') {
      try {
        const res = await createRoomMut.mutateAsync({
          data: {
            hostName: settings.hostName || "Player 1",
            boardSize: settings.boardSize,
            winLength: settings.winLength,
            timeLimit: settings.timeLimit,
            symbolX: settings.symbolX,
            symbolO: settings.symbolO,
            theme: settings.theme
          }
        });
        setLocation(`/game?room=${res.roomCode}`);
      } catch (err) {
        console.error("Failed to create room", err);
      }
    } else {
      onComplete();
    }
  };

  const handleJoin = () => {
    if (roomCodeInput.trim()) {
      updateSettings({ mode: 'online' });
      setLocation(`/game?room=${roomCodeInput.trim().toUpperCase()}`);
    }
  };

  return (
    <Card className="p-8 w-full">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <Settings2 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Game Setup</h2>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Player Name */}
        <div className="space-y-2">
          <Label>Your Name</Label>
          <Input 
            value={settings.hostName} 
            onChange={(e) => updateSettings({ hostName: e.target.value })}
            placeholder="Enter your name..."
          />
        </div>

        {/* Board Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Board Size ({settings.boardSize}x{settings.boardSize})</Label>
            <input 
              type="range" 
              min="3" max="10" 
              value={settings.boardSize}
              onChange={(e) => updateSettings({ boardSize: parseInt(e.target.value), winLength: Math.min(settings.winLength, parseInt(e.target.value)) })}
              className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <Label>Win Length ({settings.winLength})</Label>
            <input 
              type="range" 
              min="3" max={settings.boardSize} 
              value={settings.winLength}
              onChange={(e) => updateSettings({ winLength: parseInt(e.target.value) })}
              className="w-full accent-accent h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* AI Difficulty */}
        {settings.mode === 'ai' && (
          <div className="space-y-2">
            <Label>AI Difficulty</Label>
            <div className="grid grid-cols-4 gap-2">
              {['easy', 'medium', 'hard', 'unbeatable'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => updateSettings({ aiDifficulty: diff as any })}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    settings.aiDifficulty === diff 
                      ? 'bg-primary text-white neon-glow-primary' 
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Theme Selection */}
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {['classic', 'neon', 'wood', 'ice', 'fire', 'space'].map((theme) => (
              <button
                key={theme}
                onClick={() => updateSettings({ theme })}
                className={`py-2 rounded-xl text-sm font-bold uppercase transition-all border-2 ${
                  settings.theme === theme 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Symbols */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Player 1 Symbol</Label>
            <Input value={settings.symbolX} onChange={e => updateSettings({ symbolX: e.target.value.slice(0,2) })} className="text-center text-xl font-display" />
          </div>
          <div className="space-y-2">
            <Label>Player 2 Symbol</Label>
            <Input value={settings.symbolO} onChange={e => updateSettings({ symbolO: e.target.value.slice(0,2) })} className="text-center text-xl font-display" />
          </div>
        </div>

        {/* Online Join Section */}
        {settings.mode === 'online' && (
          <div className="pt-4 border-t border-border">
            <Label className="mb-2 block">Or Join Existing Room</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter Room Code" 
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="uppercase font-mono tracking-widest text-lg"
              />
              <Button variant="outline" onClick={handleJoin} className="shrink-0">
                Join
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button variant="glow" onClick={handleStart} className="flex-1 gap-2 text-lg" disabled={createRoomMut.isPending}>
          {createRoomMut.isPending ? "Creating..." : settings.mode === 'online' ? "Create Room" : "Start Game"}
          <Play className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
}
