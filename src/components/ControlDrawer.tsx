
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/context/AudioContext';
import { useTheme } from '@/context/ThemeContext';
import { Volume2, CloudRain, Wind, Trees, Flame, Bird, Droplets } from 'lucide-react';

export const ControlDrawer = () => {
  const { volume, setVolume, ambient, toggleAmbient, playThock } = useAudio();
  const { font, setFont, radius, setRadius } = useTheme();

  const atmosphericItems = [
    { id: 'wind', label: 'WIND', icon: Wind },
    { id: 'fire', label: 'FIRE', icon: Flame },
    { id: 'forest', label: 'FOREST', icon: Trees },
    { id: 'water', label: 'WATER', icon: Droplets },
    { id: 'birdsong', label: 'BIRDS', icon: Bird },
    { id: 'rain', label: 'RAIN', icon: CloudRain }
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-12">
      {/* Audio Controls */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary">Aural State</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Volume2 size={20} className="shrink-0" />
            <Slider
              value={[volume * 100]}
              onValueChange={(vals) => setVolume(vals[0] / 100)}
              max={100}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
            {atmosphericItems.map(item => (
              <Button
                key={item.id}
                variant={ambient[item.id] ? 'default' : 'outline'}
                onClick={() => { playThock(); toggleAmbient(item.id); }}
                className={`justify-start gap-3 h-10 text-[9px] font-black tracking-widest brutalist-button ${!ambient[item.id] && 'bg-transparent border-white/10'}`}
              >
                <item.icon size={14} />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Font Controls */}
      <div className="space-y-8">
        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary">Typography</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'font-sans', label: 'SANS' },
            { id: 'font-mono', label: 'MONO' },
            { id: 'font-serif', label: 'SERIF' }
          ].map(f => (
            <Button
              key={f.id}
              variant={font === f.id ? 'default' : 'outline'}
              onClick={() => { playThock(); setFont(f.id as any); }}
              className={`h-12 brutalist-button ${font !== f.id && 'bg-transparent border-white/10'}`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Radius Controls */}
      <div className="space-y-8">
        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary">Geometry</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'rounded-none', label: 'SHARP' },
            { id: 'rounded-xl', label: 'CURVED' },
            { id: 'rounded-full', label: 'ROUND' }
          ].map(r => (
            <Button
              key={r.id}
              variant={radius === r.id ? 'default' : 'outline'}
              onClick={() => { playThock(); setRadius(r.id as any); }}
              className={`h-12 brutalist-button ${radius !== r.id && 'bg-transparent border-white/10'}`}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
