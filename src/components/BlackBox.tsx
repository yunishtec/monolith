"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Flame, Eye, EyeOff, Lock, Unlock, Hash } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils';

export const BlackBox = () => {
    const [note, setNote] = useState('');
    const [isBurnEnabled, setIsBurnEnabled] = useState(false);
    const [burnTime, setBurnTime] = useState(60);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isLocked, setIsLocked] = useState(true);
    const { playThock, playSuccess, playDing } = useAudio();

    useEffect(() => {
        const handleArchive = (e: any) => {
            const { action, value } = e.detail;
            if (action === 'lock') setIsLocked(value);
            if (action === 'burn') {
                setNote('');
                setIsCountingDown(false);
                setTimeLeft(burnTime);
                playDing();
            }
        };
        window.addEventListener('monolith-archive' as any, handleArchive);
        return () => window.removeEventListener('monolith-archive' as any, handleArchive);
    }, [burnTime, playDing]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isCountingDown && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setNote('');
            setIsCountingDown(false);
            setTimeLeft(burnTime);
            playDing();
        }
        return () => clearInterval(timer);
    }, [isCountingDown, timeLeft, burnTime, playDing]);

    const handleWrite = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNote(e.target.value);
        if (isBurnEnabled && !isCountingDown && e.target.value.length > 0) {
            setIsCountingDown(true);
        }
    };

    const cipherText = (text: string) => {
        return text.split('').map(() => '!#%&/()=?*@'.charAt(Math.floor(Math.random() * 11))).join('');
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0A0B] border border-white/5 font-mono overflow-hidden group">
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Shield className={cn("text-primary", isLocked ? "opacity-50" : "animate-pulse")} size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Black_Box_Archive</span>
                </div>
                <div className="flex items-center gap-4">
                    {isCountingDown && (
                        <div className="flex items-center gap-2 text-destructive animate-pulse">
                            <Flame size={12} />
                            <span className="text-[9px] font-black tracking-widest">WIPE_IN_{timeLeft}S</span>
                        </div>
                    )}
                    <button
                        onClick={() => { playThock(); setIsLocked(!isLocked); }}
                        className={cn("p-1.5 border transition-all", isLocked ? "border-white/10 text-white/20" : "border-primary text-primary")}
                    >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                </div>
            </div>

            <div className="flex-1 relative p-4 flex flex-col gap-4 overflow-hidden">
                <div className="flex-1 relative">
                    <textarea
                        value={isLocked ? cipherText(note) : note}
                        onChange={handleWrite}
                        disabled={isLocked}
                        placeholder="ENTER_CLASSIFIED_DATA..."
                        className={cn(
                            "w-full h-full bg-transparent border-none outline-none resize-none text-[12px] leading-relaxed tracking-wider transition-all custom-scrollbar",
                            isLocked ? "text-white/5 select-none" : "text-white/80"
                        )}
                    />
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Hash size={48} className="text-white/[0.02]" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 bg-black/20 -mx-4 px-4 pb-4 shrink-0">
                    <button
                        onClick={() => { playThock(); setIsBurnEnabled(!isBurnEnabled); }}
                        className={cn(
                            "flex items-center justify-center gap-2 h-10 border text-[9px] font-black uppercase tracking-widest transition-all",
                            isBurnEnabled ? "bg-destructive/10 border-destructive text-destructive shadow-[0_0_15px_rgba(255,0,0,0.1)]" : "border-white/5 text-white/20 hover:border-white/20"
                        )}
                    >
                        <Flame size={14} /> Burn_On_Write
                    </button>
                    <div className="flex flex-col gap-1 justify-center">
                        <span className="text-[7px] text-white/20 uppercase font-black tracking-widest">Security_Level: Top_Secret</span>
                        <div className="flex gap-0.5">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className={cn("w-full h-0.5", i < 8 ? "bg-primary/20" : "bg-white/5")} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cipher HUD */}
            <div className="p-3 border-t border-white/5 bg-black/40 flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-white/20">
                <div className="flex gap-4">
                    <span>Enc: AES_256_GCM</span>
                    <span>Status: {isCountingDown ? 'VOLATILE' : 'STABLE'}</span>
                </div>
                <span>SessionID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
        </div>
    );
};
