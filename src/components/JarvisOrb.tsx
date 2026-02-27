
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export const JarvisOrb = ({ isListening, isSpeaking, peak = 0 }: { isListening: boolean; isSpeaking: boolean; peak?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [phase, setPhase] = useState(0);
    const [isBeast, setIsBeast] = useState(false);

    useEffect(() => {
        const handleBeast = (e: any) => setIsBeast(e.detail.active);
        window.addEventListener('monolith-beast' as any, handleBeast);
        return () => {
            window.removeEventListener('monolith-beast' as any, handleBeast);
        };
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const time = Date.now() / 1000;

            // Base Glow (Girly/Rain Theme)
            const glowColor = isBeast ? 'rgba(255, 30, 30, 0.4)' : (isListening ? 'rgba(255, 105, 180, 0.3)' : 'rgba(216, 180, 254, 0.15)');
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
            gradient.addColorStop(0, glowColor);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
            ctx.fill();

            // Inner Core
            const coreRadius = (isListening || isBeast) ? 15 + peak * (isBeast ? 20 : 10) : 12;
            ctx.beginPath();
            ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
            // Rose Pink for listening, Lavender for idle
            const coreColor = isBeast ? '#ff1e1e' : (isListening ? '#ff69b4' : '#d8b4fe');
            ctx.fillStyle = coreColor;
            ctx.shadowBlur = isBeast ? 25 : 15;
            ctx.shadowColor = coreColor;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Rotating Rings (Rain style)
            const drawRing = (radius: number, speed: number, dash: number, width: number, color: string) => {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.setLineDash([dash, dash]);
                ctx.lineDashOffset = time * speed * (isBeast ? 100 : 50);
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.stroke();
            };

            const primaryColor = isBeast ? 'rgba(255, 30, 30, 0.8)' : (isListening ? 'rgba(255, 105, 180, 0.7)' : 'rgba(216, 180, 254, 0.6)');
            const secondaryColor = isBeast ? 'rgba(255, 30, 30, 0.4)' : (isListening ? 'rgba(255, 105, 180, 0.3)' : 'rgba(216, 180, 254, 0.2)');

            drawRing(25, 1, 10, 2, primaryColor);
            drawRing(35, -0.5, 20, 1, secondaryColor);
            drawRing(45, 0.3, 5, 1, primaryColor);

            // Reactive Spikes when speaking
            if (isSpeaking || peak > 0.1) {
                const spikes = 60;
                const innerRadius = 30;
                const outerRadius = 30 + peak * 40;

                ctx.beginPath();
                for (let i = 0; i < spikes; i++) {
                    const angle = (i * Math.PI * 2) / spikes + time;
                    const x1 = centerX + Math.cos(angle) * innerRadius;
                    const y1 = centerY + Math.sin(angle) * innerRadius;
                    const x2 = centerX + Math.cos(angle) * outerRadius;
                    const y2 = centerY + Math.sin(angle) * outerRadius;

                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [isListening, isSpeaking, peak]);

    return (
        <div className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-[101] transition-all duration-500 pointer-events-none",
            (isListening || isSpeaking || isBeast) ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )}>
            <canvas ref={canvasRef} width={200} height={200} className="w-[150px] h-[150px]" />
            {(isListening || isSpeaking || isBeast) && (
                <div className="text-center">
                    <span className={cn(
                        "text-[8px] font-black tracking-[0.4em] uppercase",
                        isBeast ? "text-red-500 animate-pulse" : (isListening ? "text-pink-400 animate-pulse" : "text-purple-300")
                    )}>
                        {isBeast ? "BEAST_PROT_ACTIVE" : (isListening ? "Rain_Listening" : "Rain_Ready")}
                    </span>
                </div>
            )}
        </div>
    );
};
