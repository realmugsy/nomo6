import React, { useMemo } from 'react';

interface HintsProps {
  line: number[];
  type: 'row' | 'col';
}

const Hints: React.FC<HintsProps> = ({ line, type }) => {
  const hints = useMemo(() => {
    const calculatedHints: number[] = [];
    let count = 0;
    for (const cell of line) {
      if (cell === 1) {
        count++;
      } else if (count > 0) {
        calculatedHints.push(count);
        count = 0;
      }
    }
    if (count > 0) calculatedHints.push(count);
    if (calculatedHints.length === 0) calculatedHints.push(0);
    return calculatedHints;
  }, [line]);

  const containerClass = type === 'row' 
    ? "flex flex-row justify-end items-center gap-1 md:gap-2 pr-2 h-full text-xs md:text-sm font-bold text-slate-400"
    : "flex flex-col justify-end items-center gap-1 md:gap-2 pb-2 w-full text-xs md:text-sm font-bold text-slate-400";

  return (
    <div className={containerClass}>
      {hints.map((hint, i) => (
        <span key={i} className={type === 'col' ? "writing-mode-vertical" : ""}>{hint}</span>
      ))}
    </div>
  );
};

export default Hints;