
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Terminal, Target, Settings, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudio } from '@/context/AudioContext';

interface CommandRailProps {
  activePage: 'notes' | 'tasks';
  onPageChange: (page: 'notes' | 'tasks') => void;
}

export const CommandRail = ({ activePage, onPageChange }: CommandRailProps) => {
  const { playThock } = useAudio();

  const handleNav = (page: 'notes' | 'tasks') => {
    if (activePage !== page) {
      playThock();
      onPageChange(page);
    }
  };

  return (
    <nav className="w-full flex items-center justify-between border-b-4 border-primary bg-background/50 backdrop-blur-md sticky top-0 z-50 p-2 md:p-4 gap-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => handleNav('notes')}
          className={cn(
            "h-12 md:h-14 border-2 border-primary font-black uppercase tracking-tighter text-sm md:text-base px-4 md:px-8 transition-all neo-shadow",
            activePage === 'notes' ? "bg-primary text-black" : "bg-card text-foreground hover:bg-secondary"
          )}
        >
          <Terminal size={18} className="mr-2" />
          <span className="hidden sm:inline">Buffer Terminal</span>
          <span className="sm:hidden">Buffer</span>
        </Button>
        
        <Button 
          onClick={() => handleNav('tasks')}
          className={cn(
            "h-12 md:h-14 border-2 border-primary font-black uppercase tracking-tighter text-sm md:text-base px-4 md:px-8 transition-all neo-shadow",
            activePage === 'tasks' ? "bg-primary text-black" : "bg-card text-foreground hover:bg-secondary"
          )}
        >
          <Target size={18} className="mr-2" />
          <span className="hidden sm:inline">Objective Matrix</span>
          <span className="sm:hidden">Matrix</span>
        </Button>
      </div>

      <div className="flex items-center gap-4 px-4 border-l-2 border-border hidden lg:flex">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">System Load</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={cn("w-1 h-3", i < 4 ? "bg-primary" : "bg-primary/20")} />
            ))}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-primary animate-pulse flex items-center justify-center">
          <Activity size={14} className="text-primary" />
        </div>
      </div>
    </nav>
  );
};
