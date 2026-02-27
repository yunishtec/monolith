
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Settings2, AlarmClock, X, Bell, ArrowLeftRight, Music, Mic, MicOff, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCenturion } from '@/hooks/useCenturion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ThemeCustomizer } from './ThemeCustomizer';
import { Portal } from './Portal';
import { useAudio } from '@/context/AudioContext';
import { useToast } from '@/hooks/use-toast';

export const Header = ({
  onMusicToggle,
  onArchiveToggle,
  isMusicActive,
  isArchiveActive
}: {
  onMusicToggle?: () => void,
  onArchiveToggle?: () => void,
  isMusicActive?: boolean,
  isArchiveActive?: boolean
}) => {
  const [time, setTime] = useState<Date | null>(null);
  const { playThock, playSuccess } = useAudio();
  const { toast } = useToast();
  const { startListening, stopListening } = useCenturion();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const handleListening = (e: any) => setIsListening(e.detail.active);
    window.addEventListener('monolith-listening' as any, handleListening);
    return () => window.removeEventListener('monolith-listening' as any, handleListening);
  }, []);

  const toggleVoice = () => {
    playThock();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const [alarmTime, setAlarmTime] = useState<string>("");
  const [activeAlarm, setActiveAlarm] = useState<Date | null>(null);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const alarmCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('monolith_v2_active_alarm');
    if (saved) {
      const alarmDate = new Date(saved);
      if (alarmDate > new Date()) {
        setActiveAlarm(alarmDate);
      } else {
        localStorage.removeItem('monolith_v2_active_alarm');
      }
    }
  }, []);

  useEffect(() => {
    if (activeAlarm) {
      localStorage.setItem('monolith_v2_active_alarm', activeAlarm.toISOString());
    } else {
      localStorage.removeItem('monolith_v2_active_alarm');
    }
  }, [activeAlarm]);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeAlarm) {
      alarmCheckRef.current = setInterval(() => {
        const now = new Date();
        if (now >= activeAlarm) {
          playSuccess();
          toast({
            title: "TEMPORAL UPLINK REACHED",
            description: "System alarm sequence triggered.",
          });
          setActiveAlarm(null);
        }
      }, 1000);
    } else {
      if (alarmCheckRef.current) clearInterval(alarmCheckRef.current);
    }
    return () => { if (alarmCheckRef.current) clearInterval(alarmCheckRef.current); };
  }, [activeAlarm, playSuccess, toast]);

  if (!time) return null;

  const handleSetAlarm = () => {
    if (!alarmTime) return;
    playThock();
    const [hours, minutes] = alarmTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    if (date < new Date()) date.setDate(date.getDate() + 1);
    setActiveAlarm(date);
    setAlarmOpen(false);
    toast({ description: `ALARM SET FOR ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` });
  };

  const getGreeting = () => {
    const hour = time.getHours();
    let base = "Good morning";
    if (hour >= 12 && hour < 17) base = "Good afternoon";
    if (hour >= 17) base = "Good evening";
    return `${base}, Sir`;
  };

  return (
    <header className="flex justify-between items-center w-full select-none animate-in fade-in duration-500 pt-10 md:pt-0 mb-6 px-4 md:px-0 relative z-50">
      <div className="hidden md:flex flex-col">
        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{getGreeting()}</h1>
        <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] leading-none">
          {time.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-between md:justify-end gap-3">
        <Dialog open={alarmOpen} onOpenChange={(open) => { setAlarmOpen(open); if (open) playThock(); }}>
          <DialogTrigger asChild>
            <button className="group flex items-center gap-4 outline-none">
              <div className="text-2xl md:text-sm font-black tracking-[0.3em] tabular-nums leading-none text-white/60 group-hover:text-primary transition-colors">
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>
              {activeAlarm && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full animate-pulse">
                  <Bell size={12} className="text-primary" />
                  <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                    {activeAlarm.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0B] border-white/20 p-8 max-w-sm">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-sm font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                <AlarmClock size={18} /> TEMPORAL UPLINK
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">SET TARGET TIME</label>
                <Input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="bg-white/5 border-white/10 h-14 font-mono text-xl tracking-widest text-center" />
              </div>
              {activeAlarm && (
                <Button onClick={() => { setActiveAlarm(null); playThock(); }} variant="outline" className="w-full h-12 border-destructive/20 text-destructive hover:bg-destructive uppercase font-black text-[10px] tracking-widest">
                  <X size={14} className="mr-2" /> CANCEL ALARM
                </Button>
              )}
            </div>
            <DialogFooter className="mt-8">
              <Button onClick={handleSetAlarm} className="w-full h-14 bg-primary text-white hover:bg-primary/90 uppercase font-black text-[10px] tracking-widest">INITIALIZE SEQUENCE</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TACTICAL NAVIGATION CLUSTER */}
        <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-sm backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { playThock(); onMusicToggle?.(); }}
            className={cn(
              "w-10 h-10 transition-all",
              isMusicActive ? "text-primary shadow-[0_0_15px_rgba(255,0,106,0.2)] bg-primary/10" : "text-white/20 hover:text-white/60"
            )}
          >
            <Music size={18} />
          </Button>


          <Button
            variant="ghost"
            size="icon"
            onClick={() => { playThock(); onArchiveToggle?.(); }}
            className={cn(
              "w-10 h-10 transition-all",
              isArchiveActive ? "text-primary shadow-[0_0_15px_rgba(255,0,106,0.2)] bg-primary/10" : "text-white/20 hover:text-white/60"
            )}
          >
            <Database size={18} />
          </Button>

          <div className="w-px h-6 bg-white/5 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={cn(
              "w-10 h-10 transition-all",
              isListening ? "text-primary animate-pulse shadow-[0_0_20px_#ff006a]" : "text-white/20 hover:text-white/60"
            )}
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </Button>

          <Portal>
            <Button variant="ghost" size="icon" className="w-10 h-10 text-white/20 hover:text-white/60">
              <ArrowLeftRight size={18} />
            </Button>
          </Portal>
        </div>

        <Dialog onOpenChange={(open) => open && playThock()}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="w-12 h-12 border-white/10 bg-white/5 hover:bg-primary hover:text-white transition-all neo-shadow">
              <Settings2 size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] md:max-w-[75vw] w-full bg-[#0A0A0B] border-white/20 p-8 md:p-12">
            <DialogHeader className="mb-10">
              <DialogTitle className="text-sm font-black uppercase tracking-[0.6em] text-primary">System Matrix Configuration</DialogTitle>
            </DialogHeader>
            <ThemeCustomizer />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};
