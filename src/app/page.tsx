'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import {
  Terminal,
  Target,
  Zap,
  Clock,
  Database,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Cpu
} from 'lucide-react';
import { FloatingWindow } from '@/components/FloatingWindow';
import { MusicPlayer } from '@/components/MusicPlayer';
import { useCenturion } from '@/hooks/useCenturion';
import { useAudio } from '@/context/AudioContext';
import { JarvisOrb } from '@/components/JarvisOrb';

const Notepad = dynamic(() => import('@/components/Notepad').then(mod => mod.Notepad), { ssr: false });
const Tasks = dynamic(() => import('@/components/Tasks').then(mod => mod.Tasks), { ssr: false });
const PomodoroTimer = dynamic(() => import('@/components/PomodoroTimer').then(mod => mod.PomodoroTimer), { ssr: false });
const PortalInterface = dynamic(() => import('@/components/Portal').then(mod => mod.PortalInterface), { ssr: false });
const BlackBox = dynamic(() => import('@/components/BlackBox').then(mod => mod.BlackBox), { ssr: false });

type MobileTab = 'notepad' | 'tasks' | 'portal' | 'timer' | 'blackbox';

export default function Home() {
  const { playThock } = useAudio();
  const { speak, startListening } = useCenturion();
  const [isNotepadMaximized, setIsNotepadMaximized] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('portal');
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [vibe, setVibe] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleSubtitle = (e: any) => {
      const { text, isUser } = e.detail;
      setSubtitles(prev => {
        // If it's a JARVIS response update (progressive), update the last non-user sub
        if (!isUser && prev.length > 0 && !prev[prev.length - 1].isUser) {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { text, isUser: false };
          return newHistory;
        }
        return [...prev.slice(-1), { text, isUser }];
      });

      // Clear timeout for the specific sub type
      setTimeout(() => {
        setSubtitles(prev => prev.filter(s => s.text !== text));
      }, 5000);
    };
    const handleListening = (e: any) => setIsListening(e.detail.active);
    const handleSpeaking = (e: any) => setIsSpeaking(e.detail.active);

    window.addEventListener('monolith-subtitle' as any, handleSubtitle);
    window.addEventListener('monolith-listening' as any, handleListening);
    window.addEventListener('monolith-speaking' as any, handleSpeaking);
    return () => {
      window.removeEventListener('monolith-subtitle' as any, handleSubtitle);
      window.removeEventListener('monolith-listening' as any, handleListening);
      window.removeEventListener('monolith-speaking' as any, handleSpeaking);
    };
  }, []);

  useEffect(() => {
    const handleVibe = (e: any) => setVibe(e.detail.peak);
    window.addEventListener('monolith-vibe' as any, handleVibe);
    return () => window.removeEventListener('monolith-vibe' as any, handleVibe);
  }, []);

  useEffect(() => {
    const handleLayout = (e: any) => {
      if (e.detail.action === 'maximize_notepad') setIsNotepadMaximized(e.detail.value);
    };
    window.addEventListener('monolith-layout' as any, handleLayout);
    return () => window.removeEventListener('monolith-layout' as any, handleLayout);
  }, []);

  useEffect(() => {
    const handleNav = (e: any) => {
      const target = e.detail.target;
      if (target === 'atmosphere' || target === 'player' || target === 'dsp') setIsMusicOpen(true);
      if (target === 'archive' || target === 'blackbox') setIsArchiveOpen(true);

      const mobileTargets: Record<string, MobileTab> = {
        'portal': 'portal', 'bridge': 'portal',
        'notepad': 'notepad', 'buffer': 'notepad',
        'tasks': 'tasks', 'matrix': 'tasks',
        'timer': 'timer', 'engine': 'timer',
        'blackbox': 'blackbox', 'archive': 'blackbox'
      };

      if (mobileTargets[target]) {
        setActiveMobileTab(mobileTargets[target]);
      }
    };
    window.addEventListener('monolith-nav' as any, handleNav);
    return () => window.removeEventListener('monolith-nav' as any, handleNav);
  }, []);

  useEffect(() => {
    // Initial Greeting & Auto-Listen
    const hour = new Date().getHours();
    let greet = "Good evening";
    if (hour < 12) greet = "Good morning";
    else if (hour < 18) greet = "Good afternoon";

    setTimeout(() => {
      speak(`${greet}, Sir. All systems are initialized and the dashboard is at your disposal. I've prepared all mission sectors for your review.`, true);
      // Initialize passive listening after greeting
      setTimeout(() => startListening(), 2000);
    }, 1000);
  }, []);

  const mobileNavItems: { id: MobileTab, label: string, icon: any }[] = [
    { id: 'portal', label: 'BRIDGE', icon: Zap },
    { id: 'notepad', label: 'BUFFER', icon: Terminal },
    { id: 'tasks', label: 'MATRIX', icon: Target },
    { id: 'timer', label: 'ENGINE', icon: Clock },
    { id: 'blackbox', label: 'ARCHIVE', icon: Database },
  ];

  return (
    <div
      className="h-screen w-screen bg-[#0A0A0B] text-white flex flex-col p-0 md:p-8 overflow-hidden relative transition-all duration-75"
      style={{
        boxShadow: `inset 0 0 ${vibe * 100}px rgba(255, 0, 106, ${vibe * 0.1})`,
        borderColor: `rgba(255, 0, 106, ${0.05 + vibe * 0.2})`,
        borderWidth: isNotepadMaximized ? 0 : '1px'
      }}
    >
      <Header
        onMusicToggle={() => setIsMusicOpen(!isMusicOpen)}
        onArchiveToggle={() => setIsArchiveOpen(!isArchiveOpen)}
        isMusicActive={isMusicOpen}
        isArchiveActive={isArchiveOpen}
      />

      <FloatingWindow
        id="music"
        title="SONIC CORE"
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        initialPos={{ x: 100, y: 150 }}
        initialSize={{ width: 420, height: 600 }}
      >
        <MusicPlayer />
      </FloatingWindow>

      <FloatingWindow
        id="archive"
        title="BLACK BOX ARCHIVE"
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        initialPos={{ x: 550, y: 620 }}
        initialSize={{ width: 350, height: 350 }}
      >
        <BlackBox />
      </FloatingWindow>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-8 overflow-hidden min-h-0 pb-20 md:pb-0">

        {/* Mobile View: High-Performance Tabbed Matrix */}
        <div className="md:hidden flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden px-4">
          <div className="flex-1 min-h-0">
            {activeMobileTab === 'portal' && (
              <div className="h-full brutalist-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <PortalInterface isStandalone={true} />
              </div>
            )}
            {activeMobileTab === 'notepad' && (
              <div className="h-full brutalist-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <Notepad />
              </div>
            )}
            {activeMobileTab === 'tasks' && (
              <div className="h-full brutalist-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <Tasks />
              </div>
            )}
            {activeMobileTab === 'timer' && (
              <div className="h-full brutalist-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden p-6">
                <PomodoroTimer />
              </div>
            )}
            {activeMobileTab === 'blackbox' && (
              <div className="h-full brutalist-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <BlackBox />
              </div>
            )}
          </div>
        </div>

        {/* Desktop View: Grid Layout */}
        <div className="hidden md:contents">
          {!isNotepadMaximized && (
            <div className="col-span-3 h-full min-h-0 min-w-0 animate-in slide-in-from-left duration-500">
              <div
                className="h-full brutalist-card min-h-0 p-6 overflow-hidden transition-all duration-75"
                style={{ borderColor: `rgba(255, 255, 255, ${0.05 + vibe * 0.1})` }}
              >
                <PomodoroTimer />
              </div>
            </div>
          )}

          <div className={cn(
            "h-full min-h-0 min-w-0 transition-all duration-500",
            isNotepadMaximized ? "col-span-12" : "col-span-6"
          )}
            style={{ transform: `scale(${1 + vibe * 0.005})` }}
          >
            <div className="brutalist-card min-h-0 relative overflow-hidden h-full">
              <Notepad isMaximized={isNotepadMaximized} onToggleMaximize={() => setIsNotepadMaximized(!isNotepadMaximized)} />
            </div>
          </div>

          {!isNotepadMaximized && (
            <div className="col-span-3 h-full flex flex-col min-h-0 min-w-0 animate-in slide-in-from-right duration-500 gap-4">
              <div
                className="flex-1 brutalist-card overflow-hidden min-h-0 relative transition-all duration-75"
                style={{ borderColor: `rgba(255, 255, 255, ${0.05 + vibe * 0.1})` }}
              >
                <Tasks />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Matrix Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#0A0A0B] border-t border-white/10 flex justify-around items-center z-50 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMobileTab(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full border-x border-transparent relative",
              activeMobileTab === item.id
                ? "text-primary bg-primary/5 border-primary/20 shadow-[inset_0_0_10px_rgba(255,0,106,0.1)]"
                : "text-white/20 hover:text-white/60"
            )}
          >
            <item.icon size={18} />
            <span className="text-[8px] font-black tracking-widest uppercase">{item.label}</span>
            {activeMobileTab === item.id && <div className="absolute bottom-0 w-full h-0.5 bg-primary" />}
          </button>
        ))}
      </nav>

      {/* Neural Feedback HUD (Subtitles) */}
      <div className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 z-[100] pointer-events-none">
        <div className="flex flex-col items-center gap-2">
          {isListening && (
            <div className="text-[8px] font-black text-primary animate-pulse tracking-[0.5em] mb-2">
              LISTENING_FOR_COMMANDS...
            </div>
          )}
          {subtitles.map((sub, i) => (
            <div
              key={i}
              className={cn(
                "text-[10px] md:text-xs font-black uppercase tracking-[0.3em] transition-all duration-500 animate-in fade-in slide-in-from-bottom-2",
                sub.isUser ? "text-white/20 italic" : "text-white/30"
              )}
            >
              {sub.text}
            </div>
          ))}
        </div>
      </div>

      <Toaster />
      <JarvisOrb isListening={isListening} isSpeaking={isSpeaking} peak={vibe} />
    </div>
  );
}

interface Subtitle {
  text: string;
  isUser: boolean;
}
