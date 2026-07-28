import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
    return saved ? parseFloat(saved) : 6.0;
  });

  const [meteorSpeed, setMeteorSpeedState] = useState<number>(() => {
    const saved = localStorage.getItem('meteorSpeed');
    return saved ? parseFloat(saved) : 0.5;
  });

  const [galaxyStarSpeed, setGalaxyStarSpeedState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxyStarSpeed');
    return saved ? parseFloat(saved) : 0.95;
  });

  const [galaxyDensity, setGalaxyDensityState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxyDensity');
    return saved ? parseFloat(saved) : 0.9;
  });

  const [galaxyGlowIntensity, setGalaxyGlowIntensityState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxyGlowIntensity');
    return saved ? parseFloat(saved) : 0.15;
  });

  const [galaxySaturation, setGalaxySaturationState] = useState<number>(() => {
    const saved = localStorage.getItem('galaxySaturation');
    return saved ? parseFloat(saved) : 0.0;
  });

  const pendingUpdatesRef = useRef<any>({});
  const debounceTimeoutRef = useRef<any>(null);

  const queueDbUpdate = (updates: any) => {
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const updatesToSend = pendingUpdatesRef.current;
      pendingUpdatesRef.current = {};
      debounceTimeoutRef.current = null;

      try {
        const { error } = await supabase
          .from('site_settings')
          .update(updatesToSend)
          .eq('id', 'default');
        if (error) {
          console.error('Error writing settings to database:', error);
        }
      } catch (err) {
        console.error('Exception writing settings to database:', err);
      }
    }, 500);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // 1. Fetch initial settings from Supabase
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'default')
          .single();
        if (data && !error) {
          setHeroBackgroundState(data.hero_background as HeroBackgroundType);
          setMeteorDensityState(Number(data.meteor_density));
          setMeteorSpeedState(Number(data.meteor_speed));
          setGalaxyStarSpeedState(Number(data.galaxy_star_speed));
          setGalaxyDensityState(Number(data.galaxy_density));
          setGalaxyGlowIntensityState(Number(data.galaxy_glow_intensity));
          setGalaxySaturationState(Number(data.galaxy_saturation));
        }
      } catch (err) {
        console.warn('Could not fetch site settings from database, using local storage fallbacks:', err);
      }
    };

    fetchSettings();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel('site_settings_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.default'
        },
        (payload) => {
          const newSettings = payload.new;
          if (newSettings) {
            if (newSettings.hero_background !== undefined) setHeroBackgroundState(newSettings.hero_background);
            if (newSettings.meteor_density !== undefined) setMeteorDensityState(Number(newSettings.meteor_density));
            if (newSettings.meteor_speed !== undefined) setMeteorSpeedState(Number(newSettings.meteor_speed));
            if (newSettings.galaxy_star_speed !== undefined) setGalaxyStarSpeedState(Number(newSettings.galaxy_star_speed));
            if (newSettings.galaxy_density !== undefined) setGalaxyDensityState(Number(newSettings.galaxy_density));
            if (newSettings.galaxy_glow_intensity !== undefined) setGalaxyGlowIntensityState(Number(newSettings.galaxy_glow_intensity));
            if (newSettings.galaxy_saturation !== undefined) setGalaxySaturationState(Number(newSettings.galaxy_saturation));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const setHeroBackground = (bg: HeroBackgroundType) => {
    setHeroBackgroundState(bg);
    localStorage.setItem('heroBackground', bg);
    queueDbUpdate({ hero_background: bg });
  };

  const setMeteorDensity = (val: number) => {
    setMeteorDensityState(val);
    localStorage.setItem('meteorDensity', val.toString());
    queueDbUpdate({ meteor_density: val });
  };

  const setMeteorSpeed = (val: number) => {
    setMeteorSpeedState(val);
    localStorage.setItem('meteorSpeed', val.toString());
    queueDbUpdate({ meteor_speed: val });
  };

  const setGalaxyStarSpeed = (val: number) => {
    setGalaxyStarSpeedState(val);
    localStorage.setItem('galaxyStarSpeed', val.toString());
    queueDbUpdate({ galaxy_star_speed: val });
  };

  const setGalaxyDensity = (val: number) => {
    setGalaxyDensityState(val);
    localStorage.setItem('galaxyDensity', val.toString());
    queueDbUpdate({ galaxy_density: val });
  };

  const setGalaxyGlowIntensity = (val: number) => {
    setGalaxyGlowIntensityState(val);
    localStorage.setItem('galaxyGlowIntensity', val.toString());
    queueDbUpdate({ galaxy_glow_intensity: val });
  };

  const setGalaxySaturation = (val: number) => {
    setGalaxySaturationState(val);
    localStorage.setItem('galaxySaturation', val.toString());
    queueDbUpdate({ galaxy_saturation: val });
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
