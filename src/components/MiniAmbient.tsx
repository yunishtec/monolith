
"use client";

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  CloudRain,
  Wind,
  Trees,
  Flame,
  Bird,
  Droplets,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

export const MiniAmbient = () => {
  const { volume, setVolume, ambient, toggleAmbient, playThock } = useAudio();

  const sounds = [
    { id: 'wind', icon: Wind, label: 'WIND' },
    { id: 'fire', icon: Flame, label: 'FIRE' },
    { id: 'forest', icon: Trees, label: 'FOREST' },
    { id: 'water', icon: Droplets, label: 'WATER' },
    { id: 'birdsong', icon: Bird, label: 'BIRDS' },
    { id: 'rain', icon: CloudRain, label: 'RAIN' }
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Environments</span>
        <div className="flex items-center gap-2">
          <Volume2 size={10} className="text-white/20" />
          <div className="w-16">
            <Slider
              value={[volume * 100]}
              onValueChange={(v) => setVolume(v[0] / 100)}
              max={100}
              className="h-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {sounds.map((s) => (
          <button
            key={s.id}
            onClick={() => { playThock(); toggleAmbient(s.id as any); }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 border transition-all relative overflow-hidden h-14",
              ambient[s.id as keyof typeof ambient]
                ? "bg-primary/10 border-primary text-primary shadow-[inset_0_0_10px_rgba(255,0,106,0.1)]"
                : "bg-white/2 border-white/5 text-white/20 hover:border-white/10 hover:bg-white/5"
            )}
          >
            <s.icon size={14} className={cn("transition-transform", ambient[s.id as keyof typeof ambient] && "animate-pulse")} />
            <span className="text-[7px] font-black tracking-widest uppercase">{s.label}</span>
            {ambient[s.id as keyof typeof ambient] && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
