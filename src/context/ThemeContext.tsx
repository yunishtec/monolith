
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontType = 'font-sans' | 'font-mono' | 'font-serif';
type RadiusType = 'rounded-none' | 'rounded-xl' | 'rounded-full';
type AccentType = 'magenta' | 'cyan' | 'green' | 'steel';

interface ThemeContextProps {
  font: FontType;
  radius: RadiusType;
  accent: AccentType;
  setFont: (font: FontType) => void;
  setRadius: (radius: RadiusType) => void;
  setAccent: (accent: AccentType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [font, setFont] = useState<FontType>('font-sans');
  const [radius, setRadius] = useState<RadiusType>('rounded-none');
  const [accent, setAccent] = useState<AccentType>('magenta');

  // Load from persistence
  useEffect(() => {
    const saved = localStorage.getItem('monolith_v2_theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.font) setFont(parsed.font);
      if (parsed.radius) setRadius(parsed.radius);
      if (parsed.accent) setAccent(parsed.accent);
    }
  }, []);

  // Save to persistence
  useEffect(() => {
    localStorage.setItem('monolith_v2_theme', JSON.stringify({ font, radius, accent }));
    
    const root = document.documentElement;
    
    // Update Radius
    const radiusValue = radius === 'rounded-none' ? '0px' : radius === 'rounded-xl' ? '12px' : '30px';
    root.style.setProperty('--radius', radiusValue);

    // Update Accent
    let accentHsl = '334 100% 50%'; // Magenta
    if (accent === 'cyan') accentHsl = '190 100% 50%';
    if (accent === 'green') accentHsl = '84 100% 59%';
    if (accent === 'steel') accentHsl = '240 5% 50%';

    root.style.setProperty('--accent', `hsl(${accentHsl})`);
    root.style.setProperty('--primary', accentHsl);
    root.style.setProperty('--ring', accentHsl);

    // Update Font Class on body
    document.body.classList.remove('font-sans', 'font-mono', 'font-serif');
    document.body.classList.add(font);
  }, [font, radius, accent]);

  return (
    <ThemeContext.Provider value={{ font, radius, accent, setFont, setRadius, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
