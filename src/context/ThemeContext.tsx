import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
export type HeroBackgroundType = 'galaxy' | 'meteor';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  heroBackground: HeroBackgroundType;
  setHeroBackground: (bg: HeroBackgroundType) => void;
  meteorDensity: number;
  setMeteorDensity: (val: number) => void;
  meteorSpeed: number;
  setMeteorSpeed: (val: number) => void;
  galaxyStarSpeed: number;
  setGalaxyStarSpeed: (val: number) => void;
  galaxyDensity: number;
  setGalaxyDensity: (val: number) => void;
  galaxyGlowIntensity: number;
  setGalaxyGlowIntensity: (val: number) => void;
  galaxySaturation: number;
  setGalaxySaturation: (val: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });

  const [heroBackground, setHeroBackgroundState] = useState<HeroBackgroundType>(() => {
    const saved = localStorage.getItem('heroBackground');
    return (saved as HeroBackgroundType) || 'galaxy';
  });

  const [meteorDensity, setMeteorDensityState] = useState<number>(() => {
    const saved = localStorage.getItem('meteorDensity');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [meteorSpeed, setMeteorSpeedState] = useState<number>(() => {
    const saved = localStorage.getItem('meteorSpeed');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [galaxyStarSpeed, setGalaxyStarSpeedState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxyStarSpeed');
    return saved ? parseFloat(saved) : 0.6;
  });

  const [galaxyDensity, setGalaxyDensityState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxyDensity');
    return saved ? parseFloat(saved) : 0.8;
  });

  const [galaxyGlowIntensity, setGalaxyGlowIntensityState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxyGlowIntensity');
    return saved ? parseFloat(saved) : 0.2;
  });

  const [galaxySaturation, setGalaxySaturationState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxySaturation');
    return saved ? parseFloat(saved) : 0.0;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setHeroBackground = (bg: HeroBackgroundType) => {
    setHeroBackgroundState(bg);
    localStorage.setItem('heroBackground', bg);
  };

  const setMeteorDensity = (val: number) => {
    setMeteorDensityState(val);
    localStorage.setItem('meteorDensity', val.toString());
  };

  const setMeteorSpeed = (val: number) => {
    setMeteorSpeedState(val);
    localStorage.setItem('meteorSpeed', val.toString());
  };

  const setGalaxyStarSpeed = (val: number) => {
    setGalaxyStarSpeedState(val);
    localStorage.setItem('galaxyStarSpeed', val.toString());
  };

  const setGalaxyDensity = (val: number) => {
    setGalaxyDensityState(val);
    localStorage.setItem('galaxyDensity', val.toString());
  };

  const setGalaxyGlowIntensity = (val: number) => {
    setGalaxyGlowIntensityState(val);
    localStorage.setItem('galaxyGlowIntensity', val.toString());
  };

  const setGalaxySaturation = (val: number) => {
    setGalaxySaturationState(val);
    localStorage.setItem('galaxySaturation', val.toString());
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      heroBackground, 
      setHeroBackground,
      meteorDensity,
      setMeteorDensity,
      meteorSpeed,
      setMeteorSpeed,
      galaxyStarSpeed,
      setGalaxyStarSpeed,
      galaxyDensity,
      setGalaxyDensity,
      galaxyGlowIntensity,
      setGalaxyGlowIntensity,
      galaxySaturation,
      setGalaxySaturation
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
