import React from 'react';
import { CellState } from '../types';

interface GridCellProps {
  state: CellState;
  isRevealed: boolean; // For showing the solution at the end (Game Over)
  isDebug: boolean;    // For temporarily revealing the solution (Debug Toggle)
  isSolutionFilled: boolean; // True if the cell SHOULD be filled (for reveal)
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  isMobile: boolean;
  borderRightThick?: boolean;
  borderBottomThick?: boolean;
  animationDelay?: string;
  animationDuration?: string;
}

const GridCell: React.FC<GridCellProps> = ({ 
  state, 
  isRevealed, 
  isDebug,
  isSolutionFilled, 
  onMouseDown, 
  onMouseEnter,
  isMobile,
  borderRightThick,
  borderBottomThick,
  animationDelay,
  animationDuration
}) => {
  
  // Base classes
  let classes = "w-full h-full border border-slate-700 transition-all duration-100 cursor-pointer flex items-center justify-center box-border select-none";

  // Thick borders for visual separation of 5x5 blocks
  if (borderRightThick) classes += " border-r-2 border-r-slate-400";
  if (borderBottomThick) classes += " border-b-2 border-b-slate-400";

  // Determine if we should show the "Truth" (solution)
  // We show truth if game is won (isRevealed) OR if debug mode is active
  const showSolution = isRevealed || isDebug;

  // Custom style for animation
  const style: React.CSSProperties = {};
  if (isRevealed && isSolutionFilled) {
      if (animationDelay) style.animationDelay = animationDelay;
      if (animationDuration) style.animationDuration = animationDuration;
  }

  // State styling
  if (showSolution) {
    if (isSolutionFilled) {
       // Correctly filled cell (Solution)
       if (isRevealed && !isDebug) {
         // Game Won Animation: Custom rainbow pulse defined in index.html
         classes += " animate-win-pulse";
       } else {
         // Debug view or standard revealed state without animation requirements
         classes += " bg-emerald-500 border-emerald-600";
       }
    } else {
       // Empty cell (Solution)
       classes += " bg-slate-800";
       
       // Error highlight: Only show RED if it's the actual End Game reveal and the user made a mistake.
       // We do NOT show red in Debug/Peek mode.
       if (isRevealed && state === CellState.FILLED) {
         classes += " bg-red-500/50"; 
       }
    }
  } else {
    // Normal Playing State
    if (state === CellState.FILLED) {
      classes += " bg-indigo-500 hover:bg-indigo-400";
    } else if (state === CellState.CROSSED) {
      classes += " bg-slate-800 text-slate-500";
    } else {
      classes += " bg-slate-800 hover:bg-slate-700";
    }
  }

  return (
    <div 
      className={classes}
      style={style}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu to allow Right Click usage
      role="button"
      aria-label="Grid cell"
    >
      {/* Show Cross only if it's NOT revealed/debug (unless we want to see crosses on empty cells? No, usually solution cleans up) */}
      {state === CellState.CROSSED && !showSolution && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  );
};

export default React.memo(GridCell);