
"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AudioContextProps {
  volume: number;
  setVolume: (v: number) => void;
  ambient: {
    wind: boolean;
    fire: boolean;
    forest: boolean;
    water: boolean;
    birdsong: boolean;
    rain: boolean;
  };
  toggleAmbient: (type: keyof AudioContextProps['ambient']) => void;
  playThock: () => void;
  playKey: () => void;
  playDing: () => void;
  playSuccess: () => void;
}

const AudioContext = createContext<AudioContextProps | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [volume, setVolume] = useState(0.5);
  const [ambient, setAmbient] = useState({
    wind: false, fire: false, forest: false, water: false, birdsong: false, rain: false
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedVolume = localStorage.getItem('monolith_v2_volume');
    if (savedVolume) setVolume(parseFloat(savedVolume));
  }, []);

  useEffect(() => {
    localStorage.setItem('monolith_v2_volume', volume.toString());
    if (masterGainRef.current) {
      if (audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.1);
      }
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = volume * 0.4;
    }
  }, [volume]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new AudioContextClass();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    return () => {
      audioCtxRef.current?.close();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const playThock = () => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    const t = audioCtxRef.current.currentTime;
    const osc = audioCtxRef.current.createOscillator();
    const g = audioCtxRef.current.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(g);
    g.connect(masterGainRef.current);
    osc.start(t);
    osc.stop(t + 0.1);
  };

  const playKey = () => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const t = audioCtxRef.current.currentTime;
    const osc = audioCtxRef.current.createOscillator();
    const g = audioCtxRef.current.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000 + Math.random() * 500, t);
    g.gain.setValueAtTime(0.01, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(g);
    g.connect(masterGainRef.current);
    osc.start(t);
    osc.stop(t + 0.02);
  };

  const playDing = () => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const t = audioCtxRef.current.currentTime;
    const osc = audioCtxRef.current.createOscillator();
    const g = audioCtxRef.current.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(g);
    g.connect(masterGainRef.current);
    osc.start(t);
    osc.stop(t + 0.3);
  };

  const playSuccess = () => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const t = audioCtxRef.current.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = audioCtxRef.current!.createOscillator();
      const g = audioCtxRef.current!.createGain();
      osc.frequency.setValueAtTime(freq, t + i * 0.15);
      g.gain.setValueAtTime(0, t + i * 0.15);
      g.gain.linearRampToValueAtTime(0.1, t + i * 0.15 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.5);
      osc.connect(g);
      g.connect(masterGainRef.current!);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.6);
    });
  };

  const toggleAmbient = (type: keyof AudioContextProps['ambient']) => {
    setAmbient(prev => {
      const wasPlaying = prev[type];

      // Stop current sound unconditionally
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }

      const resetState = {
        wind: false, fire: false, forest: false, water: false, birdsong: false, rain: false
      };

      if (!wasPlaying) {
        const audio = new Audio(`/sounds/${type}.mp3`);
        audio.loop = true;
        audio.volume = volume * 0.4;

        currentAudioRef.current = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error("Atmospheric sound failed:", error);
            }
          });
        }

        return { ...resetState, [type]: true };
      }

      return resetState;
    });
  };

  return (
    <AudioContext.Provider value={{ volume, setVolume, ambient, toggleAmbient, playThock, playKey, playDing, playSuccess }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};
