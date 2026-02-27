
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudio } from '@/context/AudioContext';

interface FloatingWindowProps {
    id: string;
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    initialPos?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
}

export const FloatingWindow = ({
    id,
    title,
    isOpen,
    onClose,
    children,
    initialPos = { x: 100, y: 100 },
    initialSize = { width: 340, height: 460 },
    minSize = { width: 280, height: 350 }
}: FloatingWindowProps) => {
    const { playThock } = useAudio();
    const [pos, setPos] = useState(initialPos);
    const [size, setSize] = useState(initialSize);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [zIndex, setZIndex] = useState(100);

    const windowRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const resizeRef = useRef({
        isResizing: false,
        direction: '',
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        initialWidth: 0,
        initialHeight: 0
    });

    useEffect(() => {
        const saved = localStorage.getItem(`window_state_${id}`);
        if (saved) {
            const { pos: savedPos, size: savedSize } = JSON.parse(saved);
            setPos(savedPos);
            setSize(savedSize);
        }
    }, [id]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMaximized) return;
        dragRef.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: pos.x,
            initialY: pos.y
        };
        setZIndex(prev => prev + 10);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeStart = (e: React.MouseEvent, dir: string) => {
        e.preventDefault();
        e.stopPropagation();
        resizeRef.current = {
            isResizing: true,
            direction: dir,
            startX: e.clientX,
            startY: e.clientY,
            initialX: pos.x,
            initialY: pos.y,
            initialWidth: size.width,
            initialHeight: size.height
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (dragRef.current.isDragging) {
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            let newX = dragRef.current.initialX + dx;
            let newY = dragRef.current.initialY + dy;

            const currentH = isMinimized ? 40 : size.height;

            // Boundary constraints
            newX = Math.max(0, Math.min(newX, winW - size.width));
            newY = Math.max(0, Math.min(newY, winH - currentH));

            if (windowRef.current) windowRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
        }

        if (resizeRef.current.isResizing) {
            const dx = e.clientX - resizeRef.current.startX;
            const dy = e.clientY - resizeRef.current.startY;
            let newX = resizeRef.current.initialX;
            let newY = resizeRef.current.initialY;
            let newWidth = resizeRef.current.initialWidth;
            let newHeight = resizeRef.current.initialHeight;

            const dir = resizeRef.current.direction;

            if (dir.includes('e')) {
                newWidth = Math.max(minSize.width, resizeRef.current.initialWidth + dx);
                // Clamp width to screen
                if (newX + newWidth > winW) newWidth = winW - newX;
            }
            if (dir.includes('w')) {
                const calculatedWidth = resizeRef.current.initialWidth - dx;
                const maxW = resizeRef.current.initialX + resizeRef.current.initialWidth;
                newX = Math.max(0, Math.min(resizeRef.current.initialX + dx, maxW - minSize.width));
                newWidth = maxW - newX;
            }
            if (dir.includes('s')) {
                newHeight = Math.max(minSize.height, resizeRef.current.initialHeight + dy);
                // Clamp height to screen
                if (newY + newHeight > winH) newHeight = winH - newY;
            }
            if (dir.includes('n')) {
                const calculatedHeight = resizeRef.current.initialHeight - dy;
                const maxH = resizeRef.current.initialY + resizeRef.current.initialHeight;
                newY = Math.max(0, Math.min(resizeRef.current.initialY + dy, maxH - minSize.height));
                newHeight = maxH - newY;
            }

            if (windowRef.current) {
                windowRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
                windowRef.current.style.width = `${newWidth}px`;
                windowRef.current.style.height = `${newHeight}px`;
            }
        }
    };

    const handleMouseUp = () => {
        if (dragRef.current.isDragging && windowRef.current) {
            const transform = windowRef.current.style.transform;
            const match = transform.match(/translate\((.+)px, (.+)px\)/);
            if (match) {
                const newPos = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
                setPos(newPos);
                localStorage.setItem(`window_state_${id}`, JSON.stringify({ pos: newPos, size }));
            }
        }

        if (resizeRef.current.isResizing && windowRef.current) {
            const transform = windowRef.current.style.transform;
            const match = transform.match(/translate\((.+)px, (.+)px\)/);
            const newPos = match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : pos;
            const newSize = {
                width: parseFloat(windowRef.current.style.width),
                height: parseFloat(windowRef.current.style.height)
            };
            setPos(newPos);
            setSize(newSize);
            localStorage.setItem(`window_state_${id}`, JSON.stringify({ pos: newPos, size: newSize }));
        }

        dragRef.current.isDragging = false;
        resizeRef.current.isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    if (!isOpen) return null;

    const windowStyle: React.CSSProperties = isMaximized
        ? { top: 0, left: 0, width: '100vw', height: '100vh', zIndex, transform: 'none' }
        : {
            top: 0,
            left: 0,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            width: size.width,
            height: isMinimized ? 40 : size.height,
            zIndex
        };

    const resizeHandles = [
        { dir: 'n', className: 'top-0 left-0 w-full h-1 cursor-ns-resize' },
        { dir: 's', className: 'bottom-0 left-0 w-full h-1 cursor-ns-resize' },
        { dir: 'e', className: 'top-0 right-0 w-1 h-full cursor-ew-resize' },
        { dir: 'w', className: 'top-0 left-0 w-1 h-full cursor-ew-resize' },
        { dir: 'nw', className: 'top-0 left-0 w-3 h-3 cursor-nwse-resize z-50' },
        { dir: 'ne', className: 'top-0 right-0 w-3 h-3 cursor-nesw-resize z-50' },
        { dir: 'sw', className: 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-50' },
        { dir: 'se', className: 'bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-50' },
    ];

    return (
        <div
            ref={windowRef}
            style={windowStyle}
            className={cn(
                "fixed bg-[#0A0A0B]/90 backdrop-blur-xl border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col select-none",
                !isMaximized && "neo-shadow"
            )}
        >
            {/* Resize Handles */}
            {!isMaximized && !isMinimized && resizeHandles.map(h => (
                <div
                    key={h.dir}
                    className={cn("absolute", h.className)}
                    onMouseDown={(e) => handleResizeStart(e, h.dir)}
                />
            ))}

            {/* macOS style Header */}
            <div
                onMouseDown={handleMouseDown}
                className={cn(
                    "h-10 flex-shrink-0 bg-white/5 border-b border-white/10 flex items-center px-4 cursor-grab active:cursor-grabbing group transition-colors",
                    isMinimized && "bg-primary/20 border-primary/40"
                )}
            >
                <div className="flex gap-2">
                    <button
                        onClick={() => { playThock(); onClose(); }}
                        className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/10 flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                    >
                        <X size={8} className="text-black/80" />
                    </button>
                    <button
                        onClick={() => { playThock(); setIsMinimized(!isMinimized); }}
                        className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/10 flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                    >
                        <Minus size={8} className="text-black/80" />
                    </button>
                    <button
                        onClick={() => { playThock(); setIsMaximized(!isMaximized); }}
                        className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/10 flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                    >
                        <Maximize2 size={8} className="text-black/80" />
                    </button>
                </div>
                <div className="flex-1 text-center">
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                        isMinimized ? "text-primary animate-pulse" : "text-white/40 group-hover:text-white/80"
                    )}>
                        {isMinimized ? `HUD: ${title} ACTIVE` : title}
                    </span>
                </div>
                <div className="w-16" />
            </div>

            {/* Content */}
            <div className={cn("flex-1 overflow-hidden", isMinimized && "hidden")}>
                {children}
            </div>
        </div>
    );
};
