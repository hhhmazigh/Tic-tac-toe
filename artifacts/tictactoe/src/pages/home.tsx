import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Bot, Users, Globe, Settings2, Play } from "lucide-react";
import { Button, Card, Dialog } from "@/components/ui/core";
import { useAppStore } from "@/lib/store";
import { SetupForm } from "@/components/game/setup-form";

export default function Home() {
  const [_, setLocation] = useLocation();
  const [setupOpen, setSetupOpen] = useState(false);
  const updateSettings = useAppStore(state => state.updateSettings);

  const openSetup = (mode: 'ai' | 'local' | 'online') => {
    updateSettings({ mode });
    setSetupOpen(true);
  };

  const handleStart = () => {
    setSetupOpen(false);
    setLocation('/game');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Hero Grid" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center mb-16"
      >
        <h1 className="text-6xl md:text-8xl font-display font-bold text-gradient uppercase tracking-tighter mb-4 drop-shadow-2xl">
          Tic Tac Toe
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
          Experience the classic game reimagined for the modern era.
        </p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* VS AI Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="group relative overflow-hidden h-full flex flex-col items-center p-8 text-center hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer" onClick={() => openSetup('ai')}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/20 group-hover:text-primary neon-glow-primary">
              <Bot className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-wide mb-2">Vs AI</h3>
            <p className="text-muted-foreground mb-8">Train against our intelligent algorithms. 4 difficulty levels.</p>
            <div className="mt-auto">
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">Configure</Button>
            </div>
          </Card>
        </motion.div>

        {/* Pass & Play Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="group relative overflow-hidden h-full flex flex-col items-center p-8 text-center hover:border-accent/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer" onClick={() => openSetup('local')}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-accent/20 group-hover:text-accent neon-glow-accent">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-wide mb-2">Pass & Play</h3>
            <p className="text-muted-foreground mb-8">Play locally with a friend on the same device.</p>
            <div className="mt-auto">
              <Button variant="outline" className="w-full group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent">Configure</Button>
            </div>
          </Card>
        </motion.div>

        {/* Online Multiplayer Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="group relative overflow-hidden h-full flex flex-col items-center p-8 text-center hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer" onClick={() => openSetup('online')}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-purple-500/20 group-hover:text-purple-400" style={{boxShadow: "0 0 20px -5px rgba(168, 85, 247, 0.5)"}}>
              <Globe className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-wide mb-2">Online</h3>
            <p className="text-muted-foreground mb-8">Create a room and invite friends or join an existing game.</p>
            <div className="mt-auto">
              <Button variant="outline" className="w-full group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600">Configure</Button>
            </div>
          </Card>
        </motion.div>
      </div>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <SetupForm onComplete={handleStart} onCancel={() => setSetupOpen(false)} />
      </Dialog>
    </div>
  );
}
