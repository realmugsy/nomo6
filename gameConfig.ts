
import { DifficultyLevel, DifficultySettings } from './types';

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultySettings> = {
  VERY_EASY: { 
    label: 'Very Easy (90-99%)', 
    minDensity: 0.90, 
    maxDensity: 0.99 
  },
  EASY: { 
    label: 'Easy (70-90%)', 
    minDensity: 0.70, 
    maxDensity: 0.90 
  },
  MEDIUM: { 
    label: 'Medium (50-70%)', 
    minDensity: 0.50, 
    maxDensity: 0.70 
  },
  HARD: { 
    label: 'Hard (30-50%)', 
    minDensity: 0.30, 
    maxDensity: 0.50 
  },
  VERY_HARD: { 
    label: 'Very Hard (10-30%)', 
    minDensity: 0.10, 
    maxDensity: 0.30 
  }
};

export const GRID_SIZES = [5, 10, 15, 20, 25];

// Duration of the win animation cycle (one way) in milliseconds
export const WIN_ANIMATION_DURATION_MS = 1000;
