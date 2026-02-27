"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const DashboardCard = ({ children, title, className }: DashboardCardProps) => {
  return (
    <div 
      className={cn(
        "bg-card border-2 border-border p-6 h-full flex flex-col transition-all neo-shadow relative overflow-hidden",
        className
      )}
    >
      {title && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary">{title}</h2>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary" />
            <div className="w-1.5 h-1.5 bg-primary/20" />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};