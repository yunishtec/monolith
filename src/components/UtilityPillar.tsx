
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeCustomizer } from './ThemeCustomizer';
import { AmbientDeck } from './AmbientDeck';

const PomodoroTimer = dynamic(() => import('@/components/PomodoroTimer').then(mod => mod.PomodoroTimer), { ssr: false });
const Portal = dynamic(() => import('@/components/Portal').then(mod => mod.Portal), { ssr: false });

export const UtilityPillar = () => {
  return (
    <aside className="h-full border-l-4 border-border bg-card/30 flex flex-col">
      <div className="p-4 border-b-2 border-border bg-secondary/20 flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Utility Pillar</h2>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary" />
          <div className="w-2 h-2 bg-primary/40" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-8 pb-20">
          <section>
            <PomodoroTimer />
          </section>
          
          <section>
            <Portal />
          </section>
          
          <div className="pt-4 border-t-2 border-border/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Aural & Visual Control</h3>
            <div className="space-y-6">
              <AmbientDeck />
              <ThemeCustomizer />
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t-2 border-border bg-background text-[9px] font-mono text-muted-foreground/40 flex justify-between uppercase">
        <span>Uplink: Active</span>
        <span>Secure</span>
      </div>
    </aside>
  );
};
