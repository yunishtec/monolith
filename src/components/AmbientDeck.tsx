
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CloudRain, Wind, Trees, Flame, Bird, Droplets, Volume2 } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils';

export const AmbientDeck = () => {
  const { volume, setVolume, ambient, toggleAmbient, playThock } = useAudio();

  const sounds = [
    { id: 'wind', icon: Wind, label: 'Wind' },
    { id: 'fire', icon: Flame, label: 'Fire' },
    { id: 'forest', icon: Trees, label: 'Forest' },
    { id: 'water', icon: Droplets, label: 'Water' },
    { id: 'birdsong', icon: Bird, label: 'Birds' },
    { id: 'rain', icon: CloudRain, label: 'Rain' }
  ] as const;

  return (
    <DashboardCard title="Environment Matrix">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          {sounds.map((s) => (
            <Button
              key={s.id}
              variant={ambient[s.id] ? 'default' : 'outline'}
              onClick={() => { playThock(); toggleAmbient(s.id); }}
              className={cn(
                "justify-center neo-shadow h-12 text-[8px] font-black uppercase tracking-[0.2em] border-border transition-all",
                ambient[s.id] && "bg-primary text-white border-primary shadow-[0_0_10px_rgba(255,0,106,0.3)]"
              )}
            >
              <s.icon size={12} className={cn("mr-2", ambient[s.id] && "animate-pulse")} />
              {s.label}
            </Button>
          ))}
        </div>

        <div className="space-y-4 pt-2 border-t border-white/5 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={12} className="text-primary" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">Environmental Gain</span>
            </div>
            <span className="text-[10px] font-mono text-primary">{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            value={[volume * 100]}
            onValueChange={(vals) => setVolume(vals[0] / 100)}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>
      </div>
    </DashboardCard>
  );
};
