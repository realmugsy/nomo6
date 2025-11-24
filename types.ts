
export enum CellState {
  EMPTY = 0,
  FILLED = 1,
  CROSSED = 2 // User marked as definitely empty
}

export interface PuzzleData {
  title: string;
  grid: number[][]; // 0 or 1
  size: number;
  seed: number;
}

export interface GameState {
  status: 'idle' | 'playing' | 'won' | 'loading' | 'error';
  errorMessage?: string;
}

export enum ToolType {
  FILL = 'FILL',
  CROSS = 'CROSS'
}

export type DifficultyLevel = 'VERY_EASY' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

export interface DifficultySettings {
  label: string;
  minDensity: number;
  maxDensity: number;
}