import { useLocation } from "wouter";
import { ArrowLeft, Trophy, Star, Swords, Minus, TrendingUp } from "lucide-react";
import { Button, Card } from "@/components/ui/core";
import { useGetLeaderboard } from "@workspace/api-client-react";

const RANK_STYLES = [
  { label: "🥇", bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/40", text: "text-yellow-400", glow: "shadow-yellow-500/20 shadow-lg" },
  { label: "🥈", bg: "from-slate-400/20 to-slate-500/5", border: "border-slate-400/40", text: "text-slate-300", glow: "shadow-slate-400/20 shadow-md" },
  { label: "🥉", bg: "from-amber-700/20 to-amber-800/5", border: "border-amber-700/40", text: "text-amber-600", glow: "shadow-amber-700/20 shadow-md" },
];

function WinRateBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color =
    pct >= 70 ? "bg-green-400" : pct >= 45 ? "bg-cyan-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3 justify-end min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[72px]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono font-bold text-sm w-12 text-right ${color.replace("bg-", "text-")}`}>
        {pct}%
      </span>
    </div>
  );
}

function StatBadge({ value, color }: { value: number; color: string }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md font-mono font-bold text-sm ${color}`}>
      {value}
    </span>
  );
}

export default function Leaderboard() {
  const [_, setLocation] = useLocation();
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-4xl mx-auto flex flex-col">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Button>
      </div>

      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6 shadow-lg shadow-yellow-500/20">
          <Trophy className="w-10 h-10 text-yellow-400" />
        </div>
        <h1 className="text-5xl font-display font-black uppercase tracking-widest bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Hall of Fame
        </h1>
        <p className="text-muted-foreground mt-3 text-base">The greatest Tic Tac Toe minds in the universe.</p>
      </div>

      <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm">
        {/* Table header */}
        <div className="grid grid-cols-[2.5rem_1fr_5rem_5rem_5rem_8rem] gap-x-4 px-5 py-3 border-b border-white/10 bg-white/5 text-xs font-display font-semibold tracking-widest uppercase text-muted-foreground">
          <div className="text-center">#</div>
          <div className="flex items-center gap-1.5"><Star className="w-3 h-3" /> Player</div>
          <div className="text-center flex items-center justify-center gap-1"><Swords className="w-3 h-3 text-green-400" /><span>Wins</span></div>
          <div className="text-center flex items-center justify-center gap-1"><Minus className="w-3 h-3 text-slate-400" /><span>Draws</span></div>
          <div className="text-center flex items-center justify-center gap-1"><Swords className="w-3 h-3 text-red-400 rotate-180" /><span>Losses</span></div>
          <div className="flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3 text-cyan-400" /><span>Win Rate</span></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm tracking-wider uppercase font-display">Loading legends...</span>
            </div>
          ) : leaderboard?.length ? (
            leaderboard.map((entry, idx) => {
              const rankStyle = RANK_STYLES[idx];
              return (
                <div
                  key={entry.id}
                  className={`grid grid-cols-[2.5rem_1fr_5rem_5rem_5rem_8rem] gap-x-4 px-5 py-4 items-center transition-all duration-150 hover:bg-white/5 ${
                    rankStyle ? `bg-gradient-to-r ${rankStyle.bg} border-l-2 ${rankStyle.border} ${rankStyle.glow}` : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="text-center font-display font-bold text-base">
                    {rankStyle ? (
                      <span className="text-xl leading-none">{rankStyle.label}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">#{idx + 1}</span>
                    )}
                  </div>

                  {/* Player name */}
                  <div>
                    <span className={`font-semibold text-base ${rankStyle ? rankStyle.text : "text-foreground"}`}>
                      {entry.playerName}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.totalGames} games played</p>
                  </div>

                  {/* Wins */}
                  <div className="flex justify-center">
                    <StatBadge value={entry.wins} color="text-green-400 bg-green-400/10" />
                  </div>

                  {/* Draws */}
                  <div className="flex justify-center">
                    <StatBadge value={entry.draws} color="text-slate-400 bg-slate-400/10" />
                  </div>

                  {/* Losses */}
                  <div className="flex justify-center">
                    <StatBadge value={entry.losses} color="text-red-400 bg-red-400/10" />
                  </div>

                  {/* Win rate */}
                  <WinRateBar rate={entry.winRate} />
                </div>
              );
            })
          ) : (
            <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground">
              <Trophy className="w-12 h-12 opacity-20" />
              <p className="text-base">No legendary players yet.</p>
              <p className="text-sm opacity-60">Play an online game to appear here!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
