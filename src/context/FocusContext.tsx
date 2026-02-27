
"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudio } from './AudioContext';
import { useToast } from '@/hooks/use-toast';

interface FocusContextProps {
  focusMins: number;
  setFocusMins: (v: number) => void;
  breakMins: number;
  setBreakMins: (v: number) => void;
  totalIntervals: number;
  setTotalIntervals: (v: number) => void;
  timeLeft: number;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  mode: 'focus' | 'break';
  currentInterval: number;
  statusMessage: string | null;
  resetTimer: () => void;
  adjustTime: (target: 'focus' | 'break', amount: number) => void;
  handleIntervalChange: (amount: number) => void;
}

const FocusContext = createContext<FocusContextProps | undefined>(undefined);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  const { playThock, playDing, playSuccess } = useAudio();
  const { toast } = useToast();

  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [totalIntervals, setTotalIntervals] = useState(3);

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [currentInterval, setCurrentInterval] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('monolith_v2_focus_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFocusMins(parsed.focusMins || 25);
      setBreakMins(parsed.breakMins || 5);
      setTotalIntervals(parsed.totalIntervals || 3);
      setTimeLeft(parsed.focusMins * 60);
    }
  }, []);

  useEffect(() => {
    const state = { focusMins, breakMins, totalIntervals };
    localStorage.setItem('monolith_v2_focus_state', JSON.stringify(state));
  }, [focusMins, breakMins, totalIntervals]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        const nextVal = timeLeft - 1;

        // Handle side-effects BEFORE state update, or outside of the functional update
        if (nextVal === 3) {
          playDing();
          const nextMode = mode === 'focus' ? 'BREAK' : 'FOCUS';
          toast({
            title: "TEMPORAL SHIFT IMMINENT",
            description: `${nextMode} STARTING IN 3 SECONDS...`,
          });
          document.title = `[!] ${nextMode} SOON`;
        }

        if (nextVal % 60 === 0) {
          const m = nextVal / 60;
          if (m > 0) document.title = `(${m}m) MONOLITH`;
        }

        setTimeLeft(nextVal);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      playThock();
      setStatusMessage(null);
      document.title = "MONOLITH V2";

      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(breakMins * 60);
      } else {
        if (currentInterval < totalIntervals) {
          setMode('focus');
          setCurrentInterval(prev => prev + 1);
          setTimeLeft(focusMins * 60);
        } else {
          setIsActive(false);
          setMode('focus');
          setCurrentInterval(1);
          setTimeLeft(focusMins * 60);
          playSuccess();
        }
      }
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!isActive) document.title = "MONOLITH V2";
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft, mode, currentInterval, totalIntervals, focusMins, breakMins, playThock, playDing, playSuccess, toast]);

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setCurrentInterval(1);
    setTimeLeft(focusMins * 60);
    setStatusMessage(null);
    document.title = "MONOLITH V2";
  };

  const adjustTime = (target: 'focus' | 'break', amount: number) => {
    if (isActive) return;
    playThock();
    if (target === 'focus') {
      const newVal = Math.min(99, Math.max(1, focusMins + amount));
      setFocusMins(newVal);
      if (mode === 'focus') setTimeLeft(newVal * 60);
    } else {
      const newVal = Math.min(99, Math.max(1, breakMins + amount));
      setBreakMins(newVal);
      if (mode === 'break') setTimeLeft(newVal * 60);
    }
  };

  const handleIntervalChange = (amount: number) => {
    if (isActive) return;
    playThock();
    const newVal = Math.max(1, Math.min(6, totalIntervals + amount));
    setTotalIntervals(newVal);
    if (currentInterval > newVal) setCurrentInterval(newVal);
  };

  return (
    <FocusContext.Provider value={{
      focusMins, setFocusMins,
      breakMins, setBreakMins,
      totalIntervals, setTotalIntervals,
      timeLeft, isActive, setIsActive,
      mode, currentInterval, statusMessage, resetTimer,
      adjustTime, handleIntervalChange
    }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error('useFocus must be used within a FocusProvider');
  return context;
};
