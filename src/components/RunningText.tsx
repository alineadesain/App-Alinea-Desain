import React from 'react';
import { Megaphone } from 'lucide-react';

interface RunningTextProps {
  text: string;
  speed?: number; // duration in seconds, default 20
}

export const RunningText: React.FC<RunningTextProps> = ({ text, speed = 20 }) => {
  if (!text) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border border-amber-200/80 rounded-2xl py-2.5 px-3 text-amber-900 shadow-xs flex items-center gap-2.5">
      <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500/15 text-amber-700 font-bold text-xs shadow-xs">
        <Megaphone className="w-3.5 h-3.5 animate-bounce" />
      </div>

      <div className="overflow-hidden flex-1 relative whitespace-nowrap mask-gradient">
        <div
          className="animate-marquee-scroll font-medium text-xs tracking-wide"
          style={{ animationDuration: `${Math.max(5, speed)}s` }}
        >
          <span className="mr-8">{text}</span>
          <span className="mr-8 text-amber-500 font-bold">•</span>
          <span className="mr-8">{text}</span>
          <span className="mr-8 text-amber-500 font-bold">•</span>
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
};
