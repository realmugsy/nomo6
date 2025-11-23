import { PuzzleData, DifficultySettings } from "../types";

// Simple seeded random number generator
class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a float between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns integer between min and max (inclusive)
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Returns true/false
  bool(chance: number = 0.5): boolean {
    return this.next() < chance;
  }
}

export const generatePuzzle = async (
  seed: number, 
  size: number,
  difficulty: DifficultySettings
): Promise<PuzzleData> => {
  // Simulate a very short delay for UI consistency
  await new Promise(resolve => setTimeout(resolve, 50));

  const rng = new Random(seed);
  const grid: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Determine target density for this specific seed within the difficulty range
  const targetDensity = difficulty.minDensity + (rng.next() * (difficulty.maxDensity - difficulty.minDensity));
  const totalCells = size * size;
  const targetFillCount = Math.floor(totalCells * targetDensity);

  // 1. Initial Noise based on target density
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Direct probability mapping to density
      const val = rng.bool(targetDensity) ? 1 : 0;
      grid[y][x] = val;
    }
  }

  // 2. Density Correction (Post-Processing)
  // Ensure the final grid strictly respects the requested difficulty percentage.
  let currentFillCount = 0;
  grid.forEach(row => row.forEach(val => currentFillCount += val));

  let diff = currentFillCount - targetFillCount;

  // Create a list of all coordinates to pick from randomly
  const coords = [];
  for(let y=0; y<size; y++) {
      for(let x=0; x<size; x++) {
          coords.push({y, x});
      }
  }

  // Shuffle coordinates (Fisher-Yates) using our RNG
  for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
  }

  if (diff > 0) {
      // Too many filled pixels, remove some (turn 1 to 0)
      for (const {x, y} of coords) {
          if (diff === 0) break;
          if (grid[y][x] === 1) {
              grid[y][x] = 0;
              diff--;
          }
      }
  } else if (diff < 0) {
      // Too few filled pixels, add some (turn 0 to 1)
      for (const {x, y} of coords) {
          if (diff === 0) break;
          if (grid[y][x] === 0) {
              grid[y][x] = 1;
              diff++;
          }
      }
  }

  // 3. Safety check: Ensure at least one cell is filled and one is empty 
  currentFillCount = 0;
  grid.forEach(row => row.forEach(val => currentFillCount += val));
  
  if (currentFillCount === 0 && targetFillCount > 0) grid[Math.floor(size/2)][Math.floor(size/2)] = 1;
  if (currentFillCount === totalCells && targetFillCount < totalCells) grid[0][0] = 0;

  return {
    title: `Pattern #${seed}`,
    grid: grid,
    size: size,
    seed: seed,
  };
};