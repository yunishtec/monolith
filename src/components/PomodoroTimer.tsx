"use client";

import React from 'react';
import { RotateCcw, Minus, Plus } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { useFocus } from '@/context/FocusContext';
import { cn } from '@/lib/utils';

export const PomodoroTimer = () => {
  const { playThock } = useAudio();
  const {
    focusMins, breakMins, totalIntervals,
    timeLeft, isActive, setIsActive,
    mode, currentInterval, statusMessage,
    resetTimer, adjustTime, handleIntervalChange
  } = useFocus();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    playThock();
    setIsActive(!isActive);
  };

  return (
    <div className="flex flex-col h-full justify-between select-none overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Focus Engine</span>
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-all border-2",
              mode === 'focus'
                ? "bg-[#0A0A0B] text-white border-white neo-shadow"
                : "bg-[#0A0A0B] text-white border-primary neo-shadow"
            )}>
              {mode} mode
            </div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {currentInterval}/{totalIntervals}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-1 max-w-[100px] pt-1">
          {Array.from({ length: totalIntervals }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-1 transition-all",
                i + 1 < currentInterval ? "bg-primary" :
                  i + 1 === currentInterval ? "bg-primary animate-pulse" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4 flex-1 relative">
        {/* HARDWARE OVERLAY */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
        <div className="absolute inset-y-0 left-0 w-px bg-white/5" />

        <div className={cn(
          "text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.1em] leading-none select-none transition-all duration-300 relative",
          "after:content-[''] after:absolute after:inset-0 after:bg-primary/5 after:blur-xl after:opacity-0 group-hover:after:opacity-100",
          mode === 'break' ? "text-primary italic" : "text-white"
        )}
          style={{ textShadow: isActive ? '0 0 20px rgba(255,255,255,0.1)' : 'none' }}>
          <span className={cn(isActive && "animate-[pulse_2s_infinite]")}>
            {formatTime(timeLeft)}
          </span>
          {/* SCANLINE EFFECT ON TIMER */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
        </div>

        <div className="h-6 flex items-center justify-center mt-4">
          {statusMessage && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <div className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">
                {statusMessage}
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex gap-2 h-12 mt-6 relative">
          <div className="absolute -top-3 left-0 text-[7px] font-bold text-white/10 uppercase tracking-widest">Master_Trigger</div>
          <button
            onClick={handleToggle}
            className={cn(
              "flex-1 h-full border font-black uppercase tracking-[0.3em] text-[10px] transition-all relative group overflow-hidden",
              isActive
                ? "bg-white/5 border-primary text-primary shadow-[0_0_15px_rgba(255,0,106,0.15)]"
                : "bg-transparent border-white/20 text-white/40 hover:border-white hover:text-white"
            )}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              {isActive ? 'HALT_ENGINE' : 'INIT_SESSION'}
              <div className={cn("w-1 h-1 rounded-full", isActive ? "bg-primary animate-pulse shadow-[0_0_8px_#ff006a]" : "bg-white/20")} />
            </div>
          </button>
          <button
            onClick={() => { playThock(); resetTimer(); }}
            className="w-12 h-full border border-white/5 bg-transparent text-white/10 hover:text-white hover:border-white/40 flex items-center justify-center transition-all group"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="w-full h-8 border border-white/10 flex items-center justify-center font-black tracking-widest text-[8px] uppercase select-none text-white/40">
              Set Focus
            </div>
            <div className={cn(
              "flex items-center justify-between px-1 transition-opacity",
              isActive && "opacity-20 pointer-events-none"
            )}>
              <button onClick={() => adjustTime('focus', -5)} className="p-1 text-white/20 hover:text-white transition-colors">
                <Minus size={12} />
              </button>
              <span className="text-sm font-mono font-bold">{focusMins}M</span>
              <button onClick={() => adjustTime('focus', 5)} className="p-1 text-white/20 hover:text-white transition-colors">
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full h-8 border border-white/10 flex items-center justify-center font-black tracking-widest text-[8px] uppercase select-none text-white/40">
              Set Break
            </div>
            <div className={cn(
              "flex items-center justify-between px-1 transition-opacity",
              isActive && "opacity-20 pointer-events-none"
            )}>
              <button onClick={() => adjustTime('break', -1)} className="p-1 text-white/20 hover:text-white transition-colors">
                <Minus size={12} />
              </button>
              <span className="text-sm font-mono font-bold">{breakMins}M</span>
              <button onClick={() => adjustTime('break', 1)} className="p-1 text-white/20 hover:text-white transition-colors">
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Interval Cycles</span>
          </div>
          <div className={cn(
            "flex items-center gap-3 bg-white/5 px-3 py-1.5 border border-white/10 transition-opacity",
            isActive && "opacity-20 pointer-events-none"
          )}>
            <button
              onClick={() => handleIntervalChange(-1)}
              disabled={isActive}
              className="text-white/40 hover:text-white disabled:cursor-not-allowed"
            >
              <Minus size={10} />
            </button>
            <span className="text-xs font-mono font-black w-3 text-center">{totalIntervals}</span>
            <button
              onClick={() => handleIntervalChange(1)}
              disabled={isActive}
              className="text-white/40 hover:text-white disabled:cursor-not-allowed"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
