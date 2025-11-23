
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
  // e.g. if range is 0.90-0.99, pick 0.94
  const targetDensity = difficulty.minDensity + (rng.next() * (difficulty.maxDensity - difficulty.minDensity));

  // 1. Initial Noise based on target density
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Direct probability mapping to density
      // We removed center bias to strictly adhere to density requests,
      // as "Very Easy" (99%) needs to be almost entirely filled regardless of position.
      const val = rng.bool(targetDensity) ? 1 : 0;
      grid[y][x] = val;
    }
  }

  // 2. Cellular Automata Smoothing
  // Only apply light smoothing if density is not extreme.
  // Extreme densities (very high or very low) should preserve their noise properties 
  // to maintain the requested difficulty, otherwise CA might aggregate them too much.
  if (targetDensity > 0.3 && targetDensity < 0.8) {
    const iterations = 2;
    for (let i = 0; i < iterations; i++) {
        const newGrid = grid.map(row => [...row]);
        for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let neighbors = 0;
            for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dy === 0 && dx === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < size && nx >= 0 && nx < size) {
                if (grid[ny][nx] === 1) neighbors++;
                }
            }
            }

            // Standard smoothing rules
            if (grid[y][x] === 1) {
                newGrid[y][x] = neighbors >= 3 ? 1 : 0;
            } else {
                newGrid[y][x] = neighbors >= 4 ? 1 : 0;
            }
        }
        }
        // Update grid state
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                grid[y][x] = newGrid[y][x];
            }
        }
    }
  }

  // 3. Safety check: Ensure at least one cell is filled (unless density is 0 which shouldn't happen)
  // and at least one is empty (unless density is 100)
  let filledCount = 0;
  grid.forEach(row => row.forEach(cell => filledCount += cell));
  
  if (filledCount === 0) grid[Math.floor(size/2)][Math.floor(size/2)] = 1;
  if (filledCount === size * size) grid[0][0] = 0;

  return {
    title: `Pattern #${seed}`,
    grid: grid,
    size: size,
    seed: seed,
  };
};
