
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Upload,
    Music as MusicIcon,
    Trash2,
    ListMusic,
    Wind,
    Repeat,
    Repeat1,
    Shuffle,
    CloudRain,
    Flame,
    Droplets,
    Trees,
    Bird,
    Disc,
    X,
    Zap,
    Timer,
    Layout,
    Activity,
    Radio,
    Terminal,
    Maximize2,
    Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/context/AudioContext';
import { useCenturion } from '@/hooks/useCenturion';
import { cn } from '@/lib/utils';
import { getTracks, saveTrack, deleteTrack, StoredTrack } from '@/lib/db';
import * as mm from 'music-metadata-browser';

interface Track {
    id: string;
    name: string;
    url: string;
    artist?: string;
    albumArt?: string;
    data?: ArrayBuffer;
    duration?: number;
}

interface EQBands {
    bass: number;
    lowMid: number;
    mid: number;
    highMid: number;
    treble: number;
}

export const MusicPlayer = () => {
    const { playThock, playSuccess, ambient, toggleAmbient, volume: ambientVolume, setVolume: setAmbientVolume } = useAudio();
    const { announceFocusTimer } = useCenturion();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [view, setView] = useState<'player' | 'list' | 'atmosphere' | 'dsp' | 'scenes' | 'focus'>('player');

    // DSP State
    const [eq, setEq] = useState<EQBands>({ bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 });
    const [isSpatial, setIsSpatial] = useState(false);
    const [isCrunch, setIsCrunch] = useState(false);
    const [isWarmth, setIsWarmth] = useState(false);

    // Focus State
    const [focusTimer, setFocusTimer] = useState<number | null>(null);
    const [focusInitial, setFocusInitial] = useState<number>(25);

    // UI state
    const [containerWidth, setContainerWidth] = useState(340);
    const [containerHeight, setContainerHeight] = useState(460);
    const containerRef = useRef<HTMLDivElement>(null);

    // Playback Modes
    const [loopMode, setLoopMode] = useState<'none' | 'one' | 'all'>('none');
    const [isShuffled, setIsShuffled] = useState(false);
    const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);

    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Context & Nodes
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const filtersRef = useRef<Record<string, any>>({});
    const animationRef = useRef<number>(0);

    const currentTrack = currentTrackIndex >= 0 ? tracks[currentTrackIndex] : null;

    // Visuals State
    const [glowColor, setGlowColor] = useState('rgba(255, 0, 106, 0.1)');
    const [bassPulse, setBassPulse] = useState(1);
    const [vuLevel, setVuLevel] = useState(0);
    const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
    const [scrubHover, setScrubHover] = useState<number | null>(null);

    // BEAST STATE
    const [heat, setHeat] = useState(0); // Harmonic Saturation
    const [glitchFactor, setGlitchFactor] = useState(0);
    const [isBeast, setIsBeast] = useState(false);
    const dspCanvasRef = useRef<HTMLCanvasElement>(null);
    const dspAnimRef = useRef<number>(0);

    const log = (msg: string) => {
        // Log removed as per request
    };

    // Track container size
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
                setContainerHeight(entry.contentRect.height);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const isCompact = containerWidth < 300;
    const isShort = containerHeight < 400;

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // CENTURION COMMAND LISTENERS
    useEffect(() => {
        const handleNav = (e: any) => setView(e.detail.target);
        const handleBeast = (e: any) => setIsBeast(e.detail.active);
        const handleAudio = (e: any) => {
            if (e.detail.action === 'play') setIsPlaying(true);
            if (e.detail.action === 'pause') setIsPlaying(false);
            if (e.detail.action === 'next') handleNext();
            if (e.detail.action === 'prev') handlePrev();
        };
        const handleTimer = (e: any) => setFocusTimer(e.detail.mins * 60);

        const handleVolume = (e: any) => {
            const { action, value } = e.detail;
            setVolume(prev => {
                let next = prev;
                if (action === 'set') next = value ?? prev;
                if (action === 'increase') next = Math.min(1, prev + (value ?? 0.1));
                if (action === 'decrease') next = Math.max(0, prev - (value ?? 0.1));
                return next;
            });
        };

        window.addEventListener('monolith-nav' as any, handleNav);
        window.addEventListener('monolith-beast' as any, handleBeast);
        window.addEventListener('monolith-audio' as any, handleAudio);
        window.addEventListener('monolith-timer' as any, handleTimer);
        window.addEventListener('monolith-volume' as any, handleVolume);

        return () => {
            window.removeEventListener('monolith-nav' as any, handleNav);
            window.removeEventListener('monolith-beast' as any, handleBeast);
            window.removeEventListener('monolith-audio' as any, handleAudio);
            window.removeEventListener('monolith-timer' as any, handleTimer);
            window.removeEventListener('monolith-volume' as any, handleVolume);
        };
    }, []);

    // DSP Updates
    useEffect(() => {
        if (!filtersRef.current.bass) return;
        const t = audioContextRef.current!.currentTime;
        filtersRef.current.bass.gain.setTargetAtTime(eq.bass, t, 0.1);
        filtersRef.current.lowMid.gain.setTargetAtTime(eq.lowMid, t, 0.1);
        filtersRef.current.mid.gain.setTargetAtTime(eq.mid, t, 0.1);
        filtersRef.current.highMid.gain.setTargetAtTime(eq.highMid, t, 0.1);
        filtersRef.current.treble.gain.setTargetAtTime(eq.treble, t, 0.1);
    }, [eq]);

    useEffect(() => {
        if (!filtersRef.current.crunch) return;
        const amt = isCrunch ? 60 : 0;
        const curve = new Float32Array(44100);
        for (let i = 0; i < 44100; i++) {
            const x = (i * 2) / 44100 - 1;
            curve[i] = ((3 + amt) * x * 20 * (Math.PI / 180)) / (Math.PI + amt * Math.abs(x));
        }
        filtersRef.current.crunch.curve = isCrunch ? curve : null;

        if (filtersRef.current.spatial) {
            filtersRef.current.spatial.pan.setTargetAtTime(isSpatial ? 0.35 : 0, audioContextRef.current!.currentTime, 0.1);
        }

        if (filtersRef.current.warmth) {
            filtersRef.current.warmth.frequency.setTargetAtTime(isWarmth ? 2500 : 20000, audioContextRef.current!.currentTime, 0.1);
        }
        log(`DSP_UPDATE: CRNCH_${isCrunch}, SPTAL_${isSpatial}, WRMTH_${isWarmth}`);
    }, [isCrunch, isSpatial, isWarmth]);

    // Waveform Extraction
    useEffect(() => {
        if (!currentTrack || !currentTrack.data) {
            setWaveformPeaks([]);
            return;
        }
        const extract = async () => {
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const buffer = await ctx.decodeAudioData(currentTrack.data!.slice(0));
                const channelData = buffer.getChannelData(0);
                const bars = 64;
                const step = Math.floor(channelData.length / bars);
                const p = [];
                for (let i = 0; i < bars; i++) {
                    let max = 0;
                    for (let j = 0; j < step; j++) {
                        const v = Math.abs(channelData[i * step + j]);
                        if (v > max) max = v;
                    }
                    p.push(max);
                }
                setWaveformPeaks(p);
                ctx.close();
            } catch (e) { setWaveformPeaks([]); }
        };
        extract();
    }, [currentTrack]);

    const initAudioChain = useCallback(() => {
        if (!audioRef.current || audioContextRef.current) return;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        const source = ctx.createMediaElementSource(audioRef.current);

        const createFilter = (freq: number, type: BiquadFilterType) => {
            const f = ctx.createBiquadFilter();
            f.type = type;
            f.frequency.value = freq;
            return f;
        };

        const f_bass = createFilter(60, 'lowshelf');
        const f_lmid = createFilter(250, 'peaking');
        const f_mid = createFilter(1000, 'peaking');
        const f_hmid = createFilter(4000, 'peaking');
        const f_tre = createFilter(12000, 'highshelf');
        const warmth = createFilter(20000, 'lowpass');
        warmth.Q.value = 0.5;

        const crunch = ctx.createWaveShaper();
        crunch.oversample = '4x';
        const spatial = ctx.createStereoPanner();

        filtersRef.current = { bass: f_bass, lowMid: f_lmid, mid: f_mid, highMid: f_hmid, treble: f_tre, crunch, spatial, warmth };

        source.connect(crunch);
        crunch.connect(warmth);
        warmth.connect(f_bass);
        f_bass.connect(f_lmid);
        f_lmid.connect(f_mid);
        f_mid.connect(f_hmid);
        f_hmid.connect(f_tre);
        f_tre.connect(spatial);
        spatial.connect(analyser);
        analyser.connect(ctx.destination);

        analyser.fftSize = 256;
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
    }, []);

    // Beast Heat Saturation
    useEffect(() => {
        if (!filtersRef.current.crunch) return;
        const amt = (isCrunch ? 60 : 0) + (heat * 2);
        const curve = new Float32Array(44100);
        for (let i = 0; i < 44100; i++) {
            const x = (i * 2) / 44100 - 1;
            curve[i] = ((3 + amt) * x * 20 * (Math.PI / 180)) / (Math.PI + amt * Math.abs(x));
        }
        filtersRef.current.crunch.curve = curve;
    }, [isCrunch, heat]);

    useEffect(() => {
        const load = async () => {
            const stored = await getTracks();
            const mapped = stored.map(s => ({
                id: s.id,
                name: s.name,
                artist: s.artist,
                albumArt: s.albumArt,
                url: URL.createObjectURL(new Blob([s.data], { type: s.type })),
                data: s.data
            }));
            setTracks(mapped);
            if (mapped.length > 0) {
                setCurrentTrackIndex(0);
                log(`RECOVERY: ${mapped.length} TRACKS FOUND`);
            }
        };
        load();
    }, []);

    const handleNext = useCallback(() => {
        if (tracks.length === 0) return;
        initAudioChain();
        playThock();
        let next = isShuffled ? Math.floor(Math.random() * tracks.length) : (currentTrackIndex + 1) % tracks.length;
        setCurrentTrackIndex(next);
        setIsPlaying(true);
        log(`JUMP_NEXT: IDX_${next}`);
    }, [tracks.length, isShuffled, currentTrackIndex, playThock, initAudioChain]);

    const handlePrev = useCallback(() => {
        if (tracks.length === 0) return;
        initAudioChain();
        playThock();
        let p = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        setCurrentTrackIndex(p);
        setIsPlaying(true);
        log(`JUMP_PREV: IDX_${p}`);
    }, [tracks.length, currentTrackIndex, playThock, initAudioChain]);

    useEffect(() => {
        if (!audioRef.current || !currentTrack) return;
        if (isPlaying) {
            audioRef.current.play().catch(() => { });
            log(`PLAY_START: ${currentTrack.name}`);
        } else {
            audioRef.current.pause();
            log(`PLAY_PAUSE`);
        }
    }, [isPlaying, currentTrackIndex, currentTrack]);

    const togglePlay = () => {
        initAudioChain();
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
        playThock();
        setIsPlaying(!isPlaying);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const n: Track[] = [];
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            let meta, art = '';
            try {
                meta = await mm.parseBuffer(new Uint8Array(arrayBuffer), file.type);
                if (meta.common.picture?.[0]) {
                    const pic = meta.common.picture[0];
                    art = await new Promise(r => {
                        const rd = new FileReader();
                        rd.onloadend = () => r(rd.result as string);
                        rd.readAsDataURL(new Blob([new Uint8Array(pic.data)], { type: pic.format }));
                    });
                }
            } catch (e) { }
            const d: StoredTrack = {
                id: Math.random().toString(36).substr(2, 9),
                name: meta?.common.title || file.name.replace(/\.[^/.]+$/, ""),
                data: arrayBuffer,
                type: file.type,
                artist: meta?.common.artist || "UNKNOWN_SOURCE",
                albumArt: art
            };
            await saveTrack(d);
            n.push({ ...d, url: URL.createObjectURL(new Blob([arrayBuffer], { type: file.type })), data: arrayBuffer });
            log(`INGESTED: ${d.name}`);
        }
        setTracks(p => [...p, ...n]);
        if (currentTrackIndex === -1 && n.length > 0) setCurrentTrackIndex(0);
        playSuccess();
    };

    const removeTrack = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        playThock();
        await deleteTrack(id);
        const indexToRemove = tracks.findIndex(t => t.id === id);
        const newTracks = tracks.filter(t => t.id !== id);
        setTracks(newTracks);
        if (indexToRemove === currentTrackIndex) {
            setIsPlaying(false);
            setCurrentTrackIndex(newTracks.length > 0 ? 0 : -1);
        } else if (indexToRemove < currentTrackIndex) {
            setCurrentTrackIndex(currentTrackIndex - 1);
        }
        log(`PURGED: OBJ_${id}`);
    };

    const applyScene = (scene: any) => {
        playSuccess();
        setVolume(scene.vol);
        setEq(prev => ({ ...prev, ...scene.eq }));

        // Stop all atmospheric sounds first
        Object.keys(ambient).forEach(k => {
            if (ambient[k as keyof typeof ambient]) toggleAmbient(k as any);
        });

        // Small delay to ensure state sync then start new ones
        setTimeout(() => {
            scene.sounds.forEach((s: any) => toggleAmbient(s));
        }, 100);

        log(`SCENE_SYNC: ${scene.label}`);
    };

    const startFocus = (mins: number) => {
        playThock();
        setFocusInitial(mins);
        setFocusTimer(mins * 60);
        log(`ZEN_INIT: ${mins}M_CYCLE`);
    };

    const formatTime = (t: number) => {
        const m = Math.floor(t / 60), s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // VISUALIZER LOOP
    useEffect(() => {
        if (!isPlaying || !canvasRef.current || !analyserRef.current) return;
        const cn = canvasRef.current, ctx = cn.getContext('2d')!, an = analyserRef.current!;
        an.smoothingTimeConstant = 0.85;
        const buf = an.frequencyBinCount, data = new Uint8Array(buf);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            an.getByteFrequencyData(data);
            let b = 0, m = 0, h = 0;
            for (let i = 0; i < 4; i++) b += data[i];
            for (let i = 10; i < 30; i++) m += data[i];
            for (let i = 80; i < 120; i++) h += data[i];
            const ab = b / 4, am = m / 20, ah = h / 40;
            const peak = ab / 255;
            setBassPulse(1 + peak * 0.15);
            setVuLevel(peak);
            setGlowColor(`rgba(${255}, ${ah * 2}, ${106 + am * 2}, ${0.1 + peak * 0.5})`);

            // GLOBAL VIBE BROADCAST
            if (Date.now() % 2 === 0) { // Throttled broadcast
                window.dispatchEvent(new CustomEvent('monolith-vibe', { detail: { peak } }));
            }

            ctx.clearRect(0, 0, cn.width, cn.height);
            const rad = isCompact ? 70 : 100, cx = cn.width / 2, cy = cn.height / 2;
            const time = Date.now() / 1000;

            // 3D Perspective Grid
            ctx.strokeStyle = `rgba(255, 0, 106, ${0.05 + (ab / 255) * 0.1})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                const y = cy + (i * 20) - 100;
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cn.width, y); ctx.stroke();
            }

            // Outer Multi-Ring Visualizer
            [1.1, 1.3, 1.6].forEach((scale, ringIdx) => {
                ctx.beginPath();
                for (let i = 0; i < buf; i++) {
                    const bh = (data[i] / 255) * (50 * scale), ang = (i * 2 * Math.PI) / buf + (time * (ringIdx % 2 ? 1 : -1) * 0.2);
                    const x = cx + Math.cos(ang) * (rad * scale + bh), y = cy + Math.sin(ang) * (rad * scale + bh);
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = `rgba(255, ${data[10]}, 106, ${0.1 + (ab / 255) * 0.3})`;
                ctx.stroke();
            });

            // Signal Pillars
            for (let i = 0; i < 64; i += 2) {
                const bh = (data[i] / 255) * 150, ang = (i * 2 * Math.PI) / 64 + (time * 0.1);
                const x1 = cx + Math.cos(ang) * rad, y1 = cy + Math.sin(ang) * rad;
                const x2 = cx + Math.cos(ang) * (rad + bh), y2 = cy + Math.sin(ang) * (rad + bh);
                const grd = ctx.createLinearGradient(x1, y1, x2, y2);
                grd.addColorStop(0, 'rgba(255, 0, 106, 0)');
                grd.addColorStop(1, `rgba(255, 255, 255, ${data[i] / 255})`);
                ctx.strokeStyle = grd;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            }
        };
        draw();
        return () => cancelAnimationFrame(animationRef.current);
    }, [isPlaying, isCompact, isBeast]);

    // DSP SPECIFIC VISUALIZER
    useEffect(() => {
        if (view !== 'dsp' || !isPlaying || !dspCanvasRef.current || !analyserRef.current) return;
        const cn = dspCanvasRef.current, ctx = cn.getContext('2d')!, an = analyserRef.current!;
        const buf = an.frequencyBinCount, data = new Uint8Array(buf);

        const draw = () => {
            dspAnimRef.current = requestAnimationFrame(draw);
            an.getByteFrequencyData(data);
            ctx.clearRect(0, 0, cn.width, cn.height);

            const barCount = 40;
            const barWidth = cn.width / barCount;
            for (let i = 0; i < barCount; i++) {
                const val = data[Math.floor(i * buf / barCount)];
                const h = (val / 255) * cn.height * 0.8;
                const opacity = 0.03 + (val / 255) * 0.1;

                const grd = ctx.createLinearGradient(0, cn.height, 0, cn.height - h);
                grd.addColorStop(0, `rgba(255, 0, 106, 0)`);
                grd.addColorStop(1, `rgba(255, 0, 106, ${opacity})`);

                ctx.fillStyle = grd;
                ctx.fillRect(i * barWidth, cn.height - h, barWidth - 1, h);
            }
        };
        draw();
        return () => cancelAnimationFrame(dspAnimRef.current);
    }, [view, isPlaying]);

    // FOCUS TIMER
    useEffect(() => {
        if (focusTimer === null || focusTimer < 0) return;

        // CENTURION ANNOUNCEMENTS
        announceFocusTimer(focusTimer);

        if (focusTimer === 0) {
            const f = setInterval(() => {
                setVolume(p => {
                    if (p <= 0.05) { clearInterval(f); setIsPlaying(false); setFocusTimer(null); toggleAmbient('rain'); return 0; }
                    return p - 0.05;
                });
            }, 1000);
            return;
        }
        const i = setInterval(() => setFocusTimer(t => t! - 1), 1000);
        return () => clearInterval(i);
    }, [focusTimer]);

    const scenes = [
        { id: 'cyber', label: 'NEON RAIN', sounds: ['rain', 'wind'], vol: 0.6, eq: { bass: 9, treble: 5 } },
        { id: 'forest', label: 'ECHO FOREST', sounds: ['forest', 'birdsong'], vol: 0.8, eq: { mid: 4, lowMid: -2 } },
        { id: 'deep', label: 'DEEP CORE', sounds: ['fire', 'water'], vol: 0.5, eq: { bass: 12, treble: -6 } }
    ];

    return (
        <div ref={containerRef} className="h-full flex flex-col bg-[#050505] relative overflow-hidden font-mono border border-white/5 transition-all duration-1000 select-none shadow-[0_0_100px_black_inset]">
            <audio ref={audioRef} crossOrigin="anonymous" onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={handleNext} src={currentTrack?.url} />

            {/* BEAST BACKGROUND SYSTEM */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ff006a 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none transition-all duration-1000" style={{ opacity: isPlaying ? 0.2 : 0 }} />
                {/* Scene-Specific Particles */}
                {view === 'player' && isPlaying && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="absolute bg-primary/20 blur-[2px] rounded-full animate-pulse"
                                style={{
                                    width: Math.random() * 4 + 'px',
                                    height: Math.random() * 100 + 'px',
                                    left: Math.random() * 100 + '%',
                                    top: '-10%',
                                    animation: `fall ${Math.random() * 2 + 1}s linear infinite`,
                                    animationDelay: Math.random() * 2 + 's'
                                }} />
                        ))}
                    </div>
                )}
            </div>

            <div className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-500" style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`, filter: 'blur(80px)' }} />

            {/* TOP BAR - SYSTEM NAV */}
            <div className="h-14 border-b border-white/5 bg-white/2 flex items-center px-4 z-10 shrink-0 gap-2 backdrop-blur-xl">
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-2 flex-1">
                    {[
                        { id: 'player', icon: Activity, label: 'CORE' },
                        { id: 'list', icon: Radio, label: 'STORE' },
                        { id: 'dsp', icon: Zap, label: 'DSP' },
                        { id: 'atmosphere', icon: Wind, label: 'ENV' },
                        { id: 'scenes', icon: Layout, label: 'SYNC' },
                        { id: 'focus', icon: Timer, label: 'ZEN' }
                    ].map(t => (
                        <button key={t.id} onClick={() => { playThock(); setView(t.id as any); }} className={cn("px-2 py-1 text-[7px] font-black tracking-widest border flex items-center gap-1.5 transition-all min-w-fit",
                            view === t.id ? "bg-primary text-white border-primary shadow-[0_0_10px_rgba(255,0,106,0.3)]" : "border-white/10 text-white/30 hover:border-white/30 hover:text-white",
                            isCompact ? "px-1.5 py-0.5" : "px-3 py-1.5 text-[8px]"
                        )}>
                            <t.icon size={isCompact ? 9 : 11} /> {isCompact ? '' : t.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className={cn("border-2 border-primary/50 text-primary font-black uppercase hover:bg-primary hover:text-white transition-all shadow-[0_0_20px_rgba(255,0,106,0.1)]",
                    isCompact ? "h-6 px-2 text-[6px]" : "h-8 px-4 text-[8px]"
                )}>UPLINK</button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="audio/*" className="hidden" />
            </div>

            {/* MAIN VIRTUAL INTERFACE */}
            <div className="flex-1 min-h-0 relative p-6 flex flex-col items-center justify-center z-10">
                {view === 'player' && (
                    <div className="w-full h-full flex flex-col items-center justify-between animate-in fade-in zoom-in-95 duration-700">
                        <div className={cn("relative flex items-center justify-center transition-all z-10 overflow-visible flex-1 min-h-0", isShort ? "scale-[0.6] -my-10" : "my-4 h-[350px] w-full")}>
                            {!isCompact && !isShort && (
                                <div className="absolute left-[-15%] h-40 w-8 flex flex-col-reverse gap-0.5 items-center opacity-20 hidden md:flex">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className={cn("w-full transition-all duration-75 border-b border-black", i < vuLevel * 12 ? "bg-primary" : "bg-white/5")} style={{ height: '6px' }} />
                                    ))}
                                    <span className="text-[5px] font-black text-white/20 rotate-90 mt-4 tracking-widest">SIG_L</span>
                                </div>
                            )}

                            <canvas ref={canvasRef} width={600} height={600} className="absolute pointer-events-none w-[600px] h-[600px]" style={{ filter: `drop-shadow(0 0 30px ${glowColor})`, scale: isCompact ? '0.6' : isShort ? '0.5' : '1', maxWidth: 'none' }} />

                            <div style={{ transform: `scale(${bassPulse * (isCompact ? 0.7 : isShort ? 0.5 : 1)})` }} className={cn("rounded-full bg-[#080808] border-[#151515] shadow-[0_0_60px_rgba(0,0,0,0.8)] relative z-20 flex items-center justify-center transition-all duration-75 overflow-hidden group", isPlaying && "animate-[spin_6s_linear_infinite]", isCompact ? "w-28 h-28 border-[8px]" : "w-48 h-48 border-[15px]")}>
                                {currentTrack?.albumArt ? (
                                    <img src={currentTrack.albumArt} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen group-hover:scale-110 transition-transform duration-1000" />
                                ) : (
                                    <div className="absolute inset-0 rounded-full" style={{ backgroundImage: 'repeating-radial-gradient(circle, #000 0, #000 1px, #222 2px)' }} />
                                )}
                                <div className={cn("rounded-full bg-primary flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] relative z-10 border-4 border-black", (isCompact || isShort) ? "w-10 h-10" : "w-16 h-16")}>
                                    <Disc size={(isCompact || isShort) ? 18 : 24} className="text-black/60 animate-pulse" />
                                </div>
                            </div>

                            {!isCompact && !isShort && (
                                <div className="absolute right-[-15%] h-40 w-8 flex flex-col-reverse gap-0.5 items-center opacity-20 hidden md:flex">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className={cn("w-full transition-all duration-75 border-b border-black", i < vuLevel * 11 ? "bg-primary" : "bg-white/5")} style={{ height: '6px' }} />
                                    ))}
                                    <span className="text-[5px] font-black text-white/20 -rotate-90 mt-4 tracking-widest">SIG_R</span>
                                </div>
                            )}
                        </div>

                        <div className={cn("w-full shrink-0 z-10", isShort ? "space-y-2 mt-2" : "space-y-6 mt-6")}>
                            <div className="text-center relative">
                                <span className="text-[8px] text-primary font-black tracking-[0.5em] uppercase opacity-90 animate-pulse block mb-1">{currentTrack?.artist || 'SYSTEM_STDBY'}</span>
                                <h1 className={cn("text-white font-black uppercase tracking-[0.15em] px-8 truncate max-w-full leading-tight", (isCompact || isShort) ? "text-sm" : "text-3xl")}>
                                    {currentTrack?.name || "UPLOAD_SIGNAL_KEY"}
                                </h1>
                            </div>

                            <div className={cn("px-6 relative group h-14 flex flex-col justify-end transition-all", isCompact ? "px-2" : "", scrubHover !== null ? "scale-y-110" : "")}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = (e.clientX - rect.left) / rect.width;
                                    setScrubHover(x * duration);
                                }}
                                onMouseLeave={() => setScrubHover(null)}
                            >
                                <div className={cn("absolute inset-x-6 bottom-6 h-10 flex items-end gap-[1px] pointer-events-none transition-all group-hover:opacity-100 opacity-60", isCompact ? "inset-x-2" : "")}>
                                    {waveformPeaks.map((p, i) => (
                                        <div key={i} className={cn("flex-1 rounded-t-sm transition-all duration-300", (i / 64) < (currentTime / duration) ? "bg-primary" : "bg-white/10")}
                                            style={{ height: `${Math.max(4, p * (100 + (vuLevel * 50)))}%`, opacity: (i / 64) < (currentTime / duration) ? 1 : 0.4 }} />
                                    ))}
                                </div>
                                {scrubHover !== null && (
                                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black border border-primary px-2 py-1 text-[8px] font-black pointer-events-none z-30 shadow-[0_0_15px_rgba(255,0,106,0.5)]">
                                        PREVIEW: {formatTime(scrubHover)}
                                    </div>
                                )}
                                <div className="absolute bottom-6 h-10 w-px bg-white/80 shadow-[0_0_15px_white] z-10 pointer-events-none"
                                    style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                                <Slider value={[currentTime]} max={duration || 100} onValueChange={(v) => audioRef.current && (audioRef.current.currentTime = v[0])} className="h-full relative z-20 cursor-crosshair" />
                                <div className="flex justify-between text-[8px] font-black text-white/40 tracking-widest mt-1">
                                    <span className={cn(isPlaying ? "text-primary animate-pulse" : "")}>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className={cn("flex items-center justify-center gap-4 sm:gap-8 pb-4", isCompact ? "scale-90" : "")}>
                                <button onClick={() => setIsShuffled(!isShuffled)} className={cn("transition-all", isShuffled ? "text-primary scale-110" : "text-white/20 hover:text-white")}><Shuffle size={isCompact ? 14 : 18} /></button>
                                <button onClick={handlePrev} className="text-white/40 hover:text-primary transition-colors"><SkipBack size={isCompact ? 22 : 28} /></button>
                                <button onClick={togglePlay} className={cn("rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,0,106,0.4)] hover:scale-105 active:scale-95 transition-all outline-none border-4 border-black", isCompact ? "h-14 w-14" : "h-20 w-20")}>
                                    {isPlaying ? <Pause size={isCompact ? 24 : 32} fill="currentColor" /> : <Play size={isCompact ? 24 : 32} fill="currentColor" className="ml-1" />}
                                </button>
                                <button onClick={handleNext} className="text-white/40 hover:text-primary transition-colors"><SkipForward size={isCompact ? 22 : 28} /></button>
                                <button onClick={() => setLoopMode(loopMode === 'none' ? 'all' : loopMode === 'all' ? 'one' : 'none')} className={cn("transition-all", loopMode !== 'none' ? "text-primary scale-110" : "text-white/20 hover:text-white")}>
                                    {loopMode === 'one' ? <Repeat1 size={isCompact ? 14 : 18} /> : <Repeat size={isCompact ? 14 : 18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'dsp' && (
                    <div className={cn("w-full h-full flex flex-col font-mono animate-in slide-in-from-right duration-500 relative px-4 gap-4 overflow-hidden", isBeast ? "bg-primary/5" : "")}>
                        {/* THE OVERDRIVE OVERLAY */}
                        {isBeast && (
                            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                                <div className="absolute inset-0 bg-primary/2 opacity-[0.03] animate-pulse" />
                            </div>
                        )}

                        {/* SECTION: HEADER */}
                        <div className="flex items-center justify-between shrink-0 pt-2 border-b border-white/5 pb-2">
                            <div className="flex items-center gap-3">
                                <Zap className={cn("text-primary transition-all duration-700", isBeast ? "scale-125 drop-shadow-[0_0_15px_#ff006a]" : "")} size={18} />
                                <span className="text-[10px] font-black tracking-[0.3em] text-white/80">{isBeast ? 'BEAST_CORE' : 'SIGNAL_DSP'}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[7px] text-white/20 uppercase tracking-widest hidden sm:block">Status: {isPlaying ? 'MODULATING' : 'READY'}</span>
                                <button
                                    onClick={() => { playThock(); setIsBeast(!isBeast); }}
                                    className={cn("px-4 py-1.5 border-2 text-[8px] font-black transition-all uppercase tracking-widest",
                                        isBeast ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,0,106,0.3)]" : "border-white/10 text-white/40 hover:border-white/20"
                                    )}
                                >
                                    {isBeast ? 'Disengage' : 'Overdrive'}
                                </button>
                            </div>
                        </div>

                        {/* SECTION: EQ SLIDERS */}
                        <div className="flex-1 relative flex flex-col min-h-0 min-w-0">
                            {/* Neural Curve Background */}
                            <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                                <svg className="w-full h-1/2 overflow-visible" viewBox="0 0 600 200">
                                    <path
                                        d={`M 0 ${100 - (eq.bass / 15) * 80} 
                                           C 120 ${100 - (eq.bass / 15) * 80}, 120 ${100 - (eq.lowMid / 15) * 80}, 240 ${100 - (eq.lowMid / 15) * 80}
                                           S 360 ${100 - (eq.mid / 15) * 80}, 360 ${100 - (eq.mid / 15) * 80}
                                           S 480 ${100 - (eq.highMid / 15) * 80}, 480 ${100 - (eq.highMid / 15) * 80}
                                           S 550 ${100 - (eq.treble / 15) * 80}, 600 ${100 - (eq.treble / 15) * 80}`}
                                        fill="none" stroke="#ff006a" strokeWidth={isBeast ? "4" : "1"} className="transition-all duration-300"
                                    />
                                </svg>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                                <canvas ref={dspCanvasRef} width={600} height={300} className="w-full h-48 blur-[2px]" />
                            </div>

                            <div className={cn("grid h-full w-full relative z-10", isCompact ? "grid-cols-1 overflow-y-auto gap-4" : "grid-cols-5 gap-2")}>
                                {[
                                    { id: 'bass', label: 'SUB', freq: '60Hz', val: eq.bass },
                                    { id: 'lowMid', label: 'LE', freq: '250Hz', val: eq.lowMid },
                                    { id: 'mid', label: 'MID', freq: '1KHz', val: eq.mid },
                                    { id: 'highMid', label: 'PR', freq: '4KHz', val: eq.highMid },
                                    { id: 'treble', label: 'AIR', freq: '12KHz', val: eq.treble }
                                ].map((b) => (
                                    <div key={b.id} className={cn("flex flex-col items-center group h-full justify-between py-4 bg-white/[0.02] border border-white/5", isCompact ? "flex-row h-14 px-4 py-0" : "")}>
                                        <div className="text-[7px] text-white/30 font-black tracking-widest uppercase">{b.freq}</div>
                                        <div className={cn("relative flex items-center justify-center", isCompact ? "flex-1 px-8" : "flex-1 py-4 w-full h-full")}>
                                            <Slider
                                                orientation={isCompact ? "horizontal" : "vertical"}
                                                value={[b.val]} min={-15} max={15}
                                                onValueChange={(v) => {
                                                    setEq(e => ({ ...e, [b.id]: v[0] }));
                                                    if (isBeast) setHeat(prev => Math.min(100, prev + 1));
                                                }}
                                                className={cn(isCompact ? "h-1" : "h-full w-1", "group-hover:scale-x-125 transition-transform")}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black text-primary">{b.label}</span>
                                            <span className="text-[6px] text-white/20 font-bold">{b.val > 0 ? `+${b.val.toFixed(0)}` : b.val.toFixed(0)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SECTION: FX & DRIVE */}
                        <div className="shrink-0 space-y-4 pb-4">
                            <div className="bg-black/40 border border-white/5 p-4 space-y-4 backdrop-blur-xl">
                                <div className="flex items-center gap-6">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-center text-[8px] font-black tracking-widest text-white/40">
                                            <span>ANALOG_DRIVE</span>
                                            <span className="text-primary">{heat}%</span>
                                        </div>
                                        <Slider value={[heat]} max={100} onValueChange={(v) => setHeat(v[0])} className="h-1" />
                                    </div>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'crunch', label: 'CRNCH', active: isCrunch, set: setIsCrunch, icon: Zap },
                                            { id: 'spatial', label: 'SPTL', active: isSpatial, set: setIsSpatial, icon: Waves },
                                            { id: 'warmth', label: 'WARM', active: isWarmth, set: setIsWarmth, icon: Flame }
                                        ].map(fx => (
                                            <button
                                                key={fx.id}
                                                onClick={() => { playThock(); fx.set(!fx.active); }}
                                                className={cn("h-10 w-10 flex items-center justify-center border transition-all relative overflow-hidden",
                                                    fx.active ? "bg-primary/20 border-primary text-primary" : "border-white/5 text-white/20"
                                                )}
                                                title={fx.label}
                                            >
                                                <fx.icon size={12} />
                                                {fx.active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-pulse" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'atmosphere' && (
                    <div className="w-full h-full flex flex-col animate-in slide-in-from-bottom duration-500">
                        <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="col-span-2 flex items-center justify-between p-4 border border-white/5 bg-white/2 mb-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white">GENERIC_MIX</span>
                                    <span className="text-[7px] text-white/30 uppercase">Master Atmospheric Gain</span>
                                </div>
                                <Slider value={[ambientVolume * 100]} onValueChange={(v) => setAmbientVolume(v[0] / 100)} max={100} className="w-40" />
                            </div>
                            {[
                                { id: 'wind', icon: Wind, label: 'WIND' },
                                { id: 'fire', icon: Flame, label: 'FIRE' },
                                { id: 'forest', icon: Trees, label: 'FOREST' },
                                { id: 'water', icon: Droplets, label: 'WATER' },
                                { id: 'birdsong', icon: Bird, label: 'BIRDS' },
                                { id: 'rain', icon: CloudRain, label: 'RAIN' }
                            ].map(s => (
                                <button key={s.id} onClick={() => { playThock(); toggleAmbient(s.id as any); }} className={cn("flex flex-col items-center justify-center gap-4 border-2 transition-all group relative overflow-hidden",
                                    ambient[s.id as keyof typeof ambient] ? "bg-primary/20 border-primary" : "bg-white/2 border-white/5 hover:border-white/10",
                                    isShort ? "h-20" : "h-32"
                                )}>
                                    <div className={cn("rounded-full transition-all",
                                        ambient[s.id as keyof typeof ambient] ? "bg-primary text-white scale-110 shadow-[0_0_20px_rgba(255,0,106,0.3)]" : "bg-white/5 text-white/20 group-hover:text-white",
                                        isShort ? "p-2" : "p-4"
                                    )}>
                                        <s.icon size={isShort ? 18 : 24} strokeWidth={2.5} />
                                    </div>
                                    <span className={cn("font-black tracking-widest uppercase", isShort ? "text-[8px]" : "text-[10px]")}>{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'list' && (
                    <div className="w-full h-full flex flex-col font-mono animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center text-[10px] text-white/20 font-black tracking-[0.4em] mb-4 uppercase">
                            <span>DATA_VOL_01</span>
                            <div className="flex-1 h-px bg-white/5 mx-4" />
                            <Activity size={10} className="mr-2" />
                            <span className="text-primary">{tracks.length} OBJ</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {tracks.map((t, i) => (
                                <div key={t.id} onClick={() => { playThock(); setCurrentTrackIndex(i); setView('player'); setIsPlaying(true); }}
                                    className={cn("group flex items-center gap-4 p-4 border transition-all cursor-pointer relative overflow-hidden",
                                        currentTrackIndex === i ? "bg-primary/10 border-primary" : "bg-white/2 border-white/5 hover:border-white/10"
                                    )}>
                                    <div className="w-10 h-10 bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                        {t.albumArt ? <img src={t.albumArt} className="w-full h-full object-cover" /> : <MusicIcon size={14} className="text-white/20" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={cn("text-xs font-black uppercase truncate block mb-1", currentTrackIndex === i ? "text-primary" : "text-white/80")}>{t.name}</span>
                                        <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">{t.artist}</span>
                                    </div>
                                    <button onClick={(e) => removeTrack(t.id, e)} className="text-white/10 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={isCompact ? 11 : 14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'scenes' && (
                    <div className="w-full h-full flex flex-col font-mono animate-in slide-in-from-bottom duration-500">
                        <div className="text-[10px] font-black text-primary tracking-[0.5em] mb-6 uppercase border-b border-white/5 pb-4 flex items-center justify-between">
                            <span>SONIC_SCENES</span>
                            <Activity size={12} className="animate-pulse" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                            {scenes.map(s => (
                                <button key={s.id} onClick={() => applyScene(s)} className="group flex items-center p-5 border-2 border-white/5 bg-white/2 hover:border-primary transition-all text-left relative overflow-hidden">
                                    <div className="flex-1">
                                        <div className="text-sm font-black group-hover:text-primary transition-colors tracking-widest mb-1">{s.label}</div>
                                        <div className="text-[8px] text-white/30 uppercase tracking-widest font-bold">{s.sounds.join(' + ')} // EQ_TUNED</div>
                                    </div>
                                    <div className="h-10 w-10 border border-white/10 flex items-center justify-center opacity-20 group-hover:opacity-100 group-hover:border-primary transition-all">
                                        <Layout size={18} />
                                    </div>
                                    <div className="absolute right-0 top-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'focus' && (
                    <div className="w-full h-full flex flex-col items-center justify-center font-mono animate-in fade-in scale-95 duration-700">
                        <div className="text-[10px] font-black text-primary tracking-[1em] mb-12 uppercase">ZEN_MATRIX_INIT</div>
                        {focusTimer !== null ? (
                            <div className="flex flex-col items-center w-full max-w-sm">
                                <div className="text-7xl font-black text-white tracking-[0.2em] mb-8 tabular-nums drop-shadow-[0_0_30px_rgba(255,0,106,0.2)]">
                                    {Math.floor(focusTimer / 60)}:{String(focusTimer % 60).padStart(2, '0')}
                                </div>
                                <div className="w-full h-2 bg-white/5 border border-white/10 mb-12 overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 shadow-[0_0_15px_rgba(255,0,106,1)]"
                                        style={{ width: `${(focusTimer / (focusInitial * 60)) * 100}%` }} />
                                </div>
                                <Button variant="outline" onClick={() => { playThock(); setFocusTimer(null); }} className="border-primary/20 text-primary/40 hover:text-primary hover:border-primary text-[10px] font-black tracking-[0.3em] h-12 px-10 uppercase transition-all">
                                    Abort Session
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-8 w-full">
                                <span className="text-white/30 text-[9px] font-black tracking-widest uppercase">Select Temporal Cycle</span>
                                <div className="grid grid-cols-2 gap-4 w-full px-12">
                                    {[15, 25, 45, 60].map(m => (
                                        <button key={m} onClick={() => startFocus(m)} className="h-20 border-2 border-white/5 bg-white/2 flex flex-col items-center justify-center hover:border-primary hover:text-primary transition-all group">
                                            <span className="text-xl font-black tracking-widest group-hover:scale-110 transition-transform">{m}</span>
                                            <span className="text-[7px] font-bold opacity-30 uppercase">minutes</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LOWER RACK - VOLUME ONLY */}
            <div className="h-10 border-t border-white/5 bg-black flex items-center justify-center px-6 shrink-0 backdrop-blur-3xl z-20">
                <div className="flex items-center gap-3 w-full max-w-[200px]">
                    <Volume2 size={12} className="text-primary" />
                    <Slider value={[volume * 100]} max={100} onValueChange={(v) => setVolume(v[0] / 100)} className="h-1 flex-1" />
                </div>
            </div>
        </div>
    );
};
