import { Link } from "wouter";
import { Gamepad2, Trophy, Home } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 p-6 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        <Link href="/" className="group flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 text-primary neon-glow-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold text-gradient uppercase tracking-widest hidden sm:block">
            TicTacToe
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link href="/" className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all">
            <Home className="w-5 h-5" />
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all font-display font-semibold tracking-wider uppercase text-sm">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
