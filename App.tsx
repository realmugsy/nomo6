
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle } from './services/geminiService';
import { CellState, GameState, PuzzleData, ToolType, DifficultyLevel } from './types';
import { DIFFICULTY_CONFIG, GRID_SIZES, WIN_ANIMATION_DURATION_MS } from './gameConfig';
import GridCell from './components/GridCell';
import Hints from './components/Hints';

// Helper to create empty grid
const createEmptyGrid = (size: number): CellState[][] => 
  Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY));

// Helper to convert string seed to integer
const stringToSeed = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const App: React.FC = () => {
  // Game State
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [playerGrid, setPlayerGrid] = useState<CellState[][]>([]);
  const [gameState, setGameState] = useState<GameState>({ status: 'idle' });
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);
  const [isCheckHintsActive, setIsCheckHintsActive] = useState<boolean>(false);
  const [winCorner, setWinCorner] = useState<number | null>(null); // 0:TL, 1:TR, 2:BL, 3:BR
  
  // Controls
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.FILL);
  const [inputSeed, setInputSeed] = useState<string>('');
  
  // Settings
  const [selectedSize, setSelectedSize] = useState<number>(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Dragging State
  const isDragging = useRef<boolean>(false);
  const dragTargetState = useRef<CellState | null>(null);

  // Check viewport for mobile helper
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global MouseUp to stop dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
        isDragging.current = false;
        dragTargetState.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Initialize a default game or start fresh
  const startNewGame = useCallback(async (seedVal?: string) => {
    setGameState({ status: 'loading' });
    setIsDebugVisible(false); // Reset debug on new game
    setIsCheckHintsActive(false); // Reset hint checking
    setWinCorner(null); // Reset win animation
    try {
      let finalSeed: number;
      if (seedVal && seedVal.trim().length > 0) {
        if (/^\d+$/.test(seedVal)) {
            finalSeed = parseInt(seedVal, 10);
        } else {
            finalSeed = stringToSeed(seedVal);
        }
      } else {
        finalSeed = Math.floor(Math.random() * 2000000000);
      }

      const diffConfig = DIFFICULTY_CONFIG[selectedDifficulty];
      const newPuzzle = await generatePuzzle(finalSeed, selectedSize, diffConfig);
      
      setPuzzle(newPuzzle);
      setPlayerGrid(createEmptyGrid(newPuzzle.size));
      setGameState({ status: 'playing' });
    } catch (e) {
      setGameState({ status: 'error', errorMessage: 'Failed to generate puzzle.' });
    }
  }, [selectedSize, selectedDifficulty]);

  // Check for win condition
  useEffect(() => {
    if (gameState.status !== 'playing' || !puzzle) return;

    let isWin = true;
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const target = puzzle.grid[r][c];
        const current = playerGrid[r][c];
        
        if (target === 1 && current !== CellState.FILLED) {
          isWin = false;
          break;
        }
        if (target === 0 && current === CellState.FILLED) {
          isWin = false;
          break;
        }
      }
    }

    if (isWin) {
      setGameState({ status: 'won' });
      setIsDebugVisible(false); // Ensure debug is off so we see the official win state colors
      setIsCheckHintsActive(true); // Reveal all green hints on win
      setWinCorner(Math.floor(Math.random() * 4)); // Choose random corner for animation
    }
  }, [playerGrid, puzzle, gameState.status]);

  // Helper to update a single cell safely
  const updateCell = useCallback((r: number, c: number, newState: CellState) => {
    setPlayerGrid(prev => {
        if (prev[r][c] === newState) return prev;
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newState;
        return newGrid;
    });
  }, []);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if (gameState.status !== 'playing') return;
    
    let tool = activeTool;
    if (e.button === 2) {
        tool = ToolType.CROSS;
    }

    const currentCell = playerGrid[r][c];
    let targetState = CellState.EMPTY;

    if (tool === ToolType.FILL) {
        if (currentCell === CellState.FILLED) targetState = CellState.EMPTY;
        else targetState = CellState.FILLED;
    } else {
        if (currentCell === CellState.CROSSED) targetState = CellState.EMPTY;
        else targetState = CellState.CROSSED;
    }

    isDragging.current = true;
    dragTargetState.current = targetState;
    updateCell(r, c, targetState);
  };

  const handleMouseEnter = (e: React.MouseEvent, r: number, c: number) => {
    if (gameState.status !== 'playing') return;
    if (!isDragging.current || dragTargetState.current === null) return;
    
    updateCell(r, c, dragTargetState.current);
  };

  // Toggle debug visibility
  const handleDebugToggle = () => {
    setIsDebugVisible(prev => !prev);
  };

  // Toggle hints check
  const handleCheckHintsToggle = () => {
    setIsCheckHintsActive(prev => !prev);
  };

  // Instant Win Cheat
  const handleCheatWin = () => {
    if (!puzzle) return;
    const solvedGrid = puzzle.grid.map(row => 
        row.map(val => val === 1 ? CellState.FILLED : CellState.EMPTY)
    );
    setPlayerGrid(solvedGrid);
  };

  // Generate Hints
  const colHints = puzzle ? Array(puzzle.size).fill(0).map((_, c) => puzzle.grid.map(row => row[c])) : [];
  const rowHints = puzzle ? puzzle.grid : [];

  // Logic to check if a specific row or column is correctly solved
  const isRowComplete = (rowIndex: number): boolean => {
    if (!puzzle || !playerGrid.length) return false;
    // Check if player grid row matches puzzle row
    // Logic: If puzzle is 1, player must be FILLED. If puzzle is 0, player must NOT be FILLED.
    for (let c = 0; c < puzzle.size; c++) {
      const target = puzzle.grid[rowIndex][c];
      const current = playerGrid[rowIndex][c];
      if (target === 1 && current !== CellState.FILLED) return false;
      if (target === 0 && current === CellState.FILLED) return false;
    }
    return true;
  };

  const isColComplete = (colIndex: number): boolean => {
    if (!puzzle || !playerGrid.length) return false;
    for (let r = 0; r < puzzle.size; r++) {
      const target = puzzle.grid[r][colIndex];
      const current = playerGrid[r][colIndex];
      if (target === 1 && current !== CellState.FILLED) return false;
      if (target === 0 && current === CellState.FILLED) return false;
    }
    return true;
  };

  // Dynamic sizing for cells based on difficulty
  const getCellSizeClass = (size: number) => {
    if (size <= 5) return "w-10 h-10 md:w-14 md:h-14";
    if (size <= 10) return "w-6 h-6 md:w-10 md:h-10";
    if (size <= 15) return "w-5 h-5 md:w-8 md:h-8";
    if (size <= 20) return "w-4 h-4 md:w-6 md:h-6";
    return "w-3 h-3 md:w-5 md:h-5"; // Expert 25x25
  };

  // Stats calculation
  const getStats = () => {
    if (!puzzle) return { count: 0, percent: 0 };
    let filledCount = 0;
    puzzle.grid.forEach(row => row.forEach(val => filledCount += val));
    const total = puzzle.size * puzzle.size;
    return {
        count: filledCount,
        percent: ((filledCount / total) * 100).toFixed(1)
    };
  };

  const stats = getStats();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 relative overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 -z-10"></div>
       
      <header className="text-center space-y-2 mt-4">
        {/* Added pb-2 to prevent bg-clip-text from cutting off descenders */}
        <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 pb-2">
          Nonogram Puzzle
        </h1>
        <div className="h-2"></div>
        <p className="text-slate-400 text-sm md:text-base">Reveal the hidden pixel art pattern</p>
      </header>

      <div className="w-full max-w-4xl bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-xl flex flex-col items-center">
        
        {/* Top Controls Area */}
        <div className="flex flex-col items-center gap-6 w-full mb-6">
            
            {/* Settings Row */}
            <div className="flex flex-wrap gap-4 justify-center w-full">
                {/* Size Selector */}
                <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                >
                    {GRID_SIZES.map(size => (
                        <option key={size} value={size}>Size: {size}x{size}</option>
                    ))}
                </select>

                {/* Difficulty Selector */}
                <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                >
                    {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((key) => (
                        <option key={key} value={key}>{DIFFICULTY_CONFIG[key].label}</option>
                    ))}
                </select>

                <input 
                    type="text" 
                    placeholder="Seed (Optional)" 
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-32 text-center text-slate-200 placeholder-slate-500"
                    value={inputSeed}
                    onChange={(e) => setInputSeed(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startNewGame(inputSeed)}
                />
            </div>

            {/* Main Action Button */}
            <div className="flex flex-col items-center gap-2 w-full">
                <button 
                    onClick={() => startNewGame(inputSeed)}
                    disabled={gameState.status === 'loading'}
                    className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-lg md:text-xl font-bold py-3 px-12 rounded-xl shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {gameState.status === 'loading' ? 'Generating...' : 'PLAY'}
                </button>
                
                {/* Seed Display & Debug */}
                {puzzle && (gameState.status === 'playing' || gameState.status === 'won') ? (
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-xs text-slate-500 font-mono select-all cursor-pointer hover:text-slate-400 transition-colors" title="Current Game Seed">
                            Seed: {puzzle.seed}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono">
                            Filled: {stats.count} ({stats.percent}%)
                        </div>
                        {gameState.status === 'playing' && (
                            <div className="flex gap-2 mt-1">
                                <button 
                                    onClick={handleCheckHintsToggle}
                                    className={`text-[10px] uppercase font-bold tracking-wider transition-colors border border-slate-700/50 rounded px-2 py-0.5 bg-slate-900/50 ${isCheckHintsActive ? 'text-emerald-400 border-emerald-500/50' : 'text-slate-600 hover:text-emerald-400 hover:border-emerald-500/50'}`}
                                >
                                    {isCheckHintsActive ? "[CHECK] HINTS ON" : "[CHECK] HINTS OFF"}
                                </button>
                                <button 
                                    onClick={handleDebugToggle}
                                    className="text-[10px] uppercase font-bold tracking-wider text-slate-600 hover:text-rose-400 transition-colors border border-slate-700/50 hover:border-rose-500/50 rounded px-2 py-0.5 bg-slate-900/50"
                                >
                                    {isDebugVisible ? "[DEBUG] HIDE SOLUTION" : "[DEBUG] SHOW SOLUTION"}
                                </button>
                                <button 
                                    onClick={handleCheatWin}
                                    className="text-[10px] uppercase font-bold tracking-wider text-slate-600 hover:text-emerald-400 transition-colors border border-slate-700/50 hover:border-emerald-500/50 rounded px-2 py-0.5 bg-slate-900/50"
                                >
                                    [CHEAT] WIN
                                </button>
                            </div>
                        )}
                    </div>
                ) : <div className="h-4"></div>}
            </div>

            {/* Mobile Tool Toggles */}
            {gameState.status === 'playing' && isMobile && (
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-full max-w-sm justify-center gap-4 mt-2">
                    <button 
                        onClick={() => setActiveTool(ToolType.FILL)}
                        className={`px-8 py-2 rounded-md text-sm font-bold transition-colors w-1/2 ${activeTool === ToolType.FILL ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'}`}
                    >
                        Fill
                    </button>
                    <button 
                        onClick={() => setActiveTool(ToolType.CROSS)}
                        className={`px-8 py-2 rounded-md text-sm font-bold transition-colors w-1/2 ${activeTool === ToolType.CROSS ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'}`}
                    >
                        Cross (X)
                    </button>
                </div>
            )}
        </div>

        {gameState.status === 'error' && (
            <div className="text-rose-400 bg-rose-950/30 p-4 rounded-lg border border-rose-900 mb-4 text-center w-full">
                {gameState.errorMessage}
            </div>
        )}

        {gameState.status === 'idle' && (
             <div className="text-center py-12 text-slate-400">
                <p>Select settings above and press New Game to start.</p>
             </div>
        )}

        {/* The Grid Container - Responsive scrolling for very large grids on small screens if needed, though we try to fit */}
        {puzzle && (gameState.status === 'playing' || gameState.status === 'won') && (
          <div className="max-w-full overflow-auto p-1">
            <div 
                className="grid gap-0 select-none bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-2xl touch-none mx-auto"
                style={{
                    // Auto for row headers, then N columns of flexible width but constrained by max-content to fit tight
                    gridTemplateColumns: `auto repeat(${puzzle.size}, min-content)`,
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Top-Left Corner */}
                <div className="border-b border-r border-slate-800 bg-slate-900/50"></div>

                {/* Column Hints */}
                {colHints.map((col, i) => {
                const isThickRight = (i + 1) % 5 === 0 && i !== puzzle.size - 1;
                const isColCorrect = isCheckHintsActive && isColComplete(i);
                
                let classes = "bg-slate-900/50 border-b border-slate-800 pb-1 flex flex-col justify-end";
                if (isThickRight) classes += " border-r-2 border-r-slate-400";
                else classes += " border-r border-slate-800";
                
                return (
                    <div key={`col-hint-${i}`} className={classes}>
                        <Hints line={col} type="col" isComplete={isColCorrect} />
                    </div>
                );
                })}

                {/* Rows */}
                {rowHints.map((row, r) => {
                const isThickBottom = (r + 1) % 5 === 0 && r !== puzzle.size - 1;
                const isRowCorrect = isCheckHintsActive && isRowComplete(r);
                
                let hintClasses = "border-r border-slate-800 pr-1 flex items-center justify-end bg-slate-900/50";
                
                if (isThickBottom) hintClasses += " border-b-2 border-b-slate-400";
                else hintClasses += " border-b border-slate-800";

                return (
                    <React.Fragment key={`row-${r}`}>
                        <div className={hintClasses}>
                            <Hints line={row} type="row" isComplete={isRowCorrect} />
                        </div>
                        
                        {playerGrid[r].map((cellState, c) => {
                            // Calculate animation delay for wave effect
                            let delay = "0ms";
                            if (gameState.status === 'won' && winCorner !== null) {
                                let dist = 0;
                                const s = puzzle.size - 1;
                                switch(winCorner) {
                                    case 0: dist = r + c; break; // TL
                                    case 1: dist = r + (s - c); break; // TR
                                    case 2: dist = (s - r) + c; break; // BL
                                    case 3: dist = (s - r) + (s - c); break; // BR
                                }
                                // 50ms per cell distance step
                                delay = `${dist * 50}ms`; 
                            }

                            return (
                                <div key={`cell-${r}-${c}`} className={`aspect-square ${getCellSizeClass(puzzle.size)}`}>
                                    <GridCell
                                        state={cellState}
                                        isRevealed={gameState.status === 'won'}
                                        isDebug={isDebugVisible}
                                        isSolutionFilled={puzzle.grid[r][c] === 1}
                                        onMouseDown={(e) => handleMouseDown(e, r, c)}
                                        onMouseEnter={(e) => handleMouseEnter(e, r, c)}
                                        isMobile={isMobile}
                                        borderRightThick={(c + 1) % 5 === 0 && c !== puzzle.size - 1}
                                        borderBottomThick={(r + 1) % 5 === 0 && r !== puzzle.size - 1}
                                        animationDelay={delay}
                                        animationDuration={`${WIN_ANIMATION_DURATION_MS}ms`}
                                    />
                                </div>
                            );
                        })}
                    </React.Fragment>
                );
                })}
            </div>
          </div>
        )}

        {gameState.status === 'won' && puzzle && (
            <div className="mt-8 text-center animate-bounce">
                <h2 className="text-3xl font-bold text-emerald-400 mb-2">Puzzle Solved!</h2>
                <p className="text-slate-300">It was: <span className="text-indigo-400 font-bold text-lg uppercase">{puzzle.title}</span></p>
                <button 
                    onClick={() => startNewGame(inputSeed)}
                    className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-900/50 transition-all hover:scale-105"
                >
                    Play Another
                </button>
            </div>
        )}
      </div>

      <footer className="text-xs text-slate-600 mt-auto py-4">
         Built with React & Tailwind
      </footer>
    </div>
  );
};

export default App;