
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { Type, Layers, Palette } from 'lucide-react';

export const ThemeCustomizer = () => {
  const { font, radius, accent, setFont, setRadius, setAccent } = useTheme();
  const { playThock } = useAudio();

  const handleSelect = (setter: (val: any) => void, val: any) => {
    playThock();
    setter(val);
  };

  return (
    <div className="space-y-12">
      {/* Accent Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Palette size={16} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Neural Accent Selection</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { id: 'magenta', color: 'bg-[#FF006E]', label: 'PLASMA' },
            { id: 'cyan', color: 'bg-[#00F5FF]', label: 'CORE' },
            { id: 'green', color: 'bg-[#ADFF2F]', label: 'TOXIC' },
            { id: 'steel', color: 'bg-[#808080]', label: 'STEEL' }
          ].map(a => (
            <Button 
              key={a.id}
              variant={accent === a.id ? 'default' : 'outline'}
              onClick={() => handleSelect(setAccent, a.id)}
              className={`h-20 flex flex-col gap-2 border-white/10 bg-white/5 transition-all ${accent === a.id ? 'border-primary ring-2 ring-primary/20 bg-primary/10' : 'hover:border-white/20'}`}
            >
              <div className={`w-4 h-4 ${a.color} rounded-full`} />
              <span className="text-[10px] font-black tracking-[0.2em]">{a.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {/* Typography Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Type size={16} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Visual Syntax</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'font-sans', label: 'SYSTEM SANS' },
              { id: 'font-mono', label: 'TERMINAL MONO' },
              { id: 'font-serif', label: 'ARCHIVE SERIF' }
            ].map(f => (
              <Button 
                key={f.id}
                variant={font === f.id ? 'default' : 'outline'}
                onClick={() => handleSelect(setFont, f.id as any)}
                className={`h-14 text-xs font-black tracking-[0.2em] border-white/10 bg-white/5 ${font === f.id ? 'border-primary bg-primary/10' : 'hover:border-white/20'}`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Geometry Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Layers size={16} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Frame Geometry</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'rounded-none', label: 'SHARP EDGE' },
              { id: 'rounded-xl', label: 'RELAXED CURVE' },
              { id: 'rounded-full', label: 'TOTAL CIRCLE' }
            ].map(r => (
              <Button 
                key={r.id}
                variant={radius === r.id ? 'default' : 'outline'}
                onClick={() => handleSelect(setRadius, r.id as any)}
                className={`h-14 text-xs font-black tracking-[0.2em] border-white/10 bg-white/5 ${radius === r.id ? 'border-primary bg-primary/10' : 'hover:border-white/20'}`}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
