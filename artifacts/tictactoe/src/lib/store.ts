import { create } from 'zustand';

export type GameMode = 'ai' | 'local' | 'online';
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'unbeatable';

export interface GameSettings {
  mode: GameMode;
  hostName: string;
  boardSize: number;
  winLength: number;
  theme: string;
  symbolX: string;
  symbolO: string;
  aiDifficulty: AIDifficulty;
  timeLimit: number | null; // seconds
}

interface AppState {
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
}

const defaultSettings: GameSettings = {
  mode: 'ai',
  hostName: 'Player 1',
  boardSize: 3,
  winLength: 3,
  theme: 'neon',
  symbolX: 'X',
  symbolO: 'O',
  aiDifficulty: 'medium',
  timeLimit: null,
};

export const useAppStore = create<AppState>((set) => ({
  settings: defaultSettings,
  updateSettings: (newSettings) => 
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
