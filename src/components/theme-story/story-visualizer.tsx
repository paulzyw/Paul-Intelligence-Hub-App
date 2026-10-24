import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoryScene } from './story-data';
import { useTheme } from '../../context/ThemeContext';

interface StoryVisualizerProps {
  activeScene: StoryScene;
}

interface SceneImagePair {
  dark: string;
  light: string;
  fallbackDark: string;
  fallbackLight: string;
  alt: string;
  stepName: string;
}

const SCENE_IMAGES: Record<string, SceneImagePair> = {
  "01": {
    dark: "/images/info_inherit_dark.webp",
    light: "/images/info_inherit_light.webp",
    fallbackDark: "/assets/images/info_inherit_dark.webp",
    fallbackLight: "/assets/images/info_inherit_light.webp",
    alt: "RevOS SQL Qualification - Start With What You Already Know",
    stepName: "Problem & Goal Context"
  },
  "02": {
    dark: "/images/evidence_dark.webp",
    light: "/images/evidence_light.webp",
    fallbackDark: "/assets/images/evidence_dark.webp",
    fallbackLight: "/assets/images/evidence_light.webp",
    alt: "RevOS SQL Qualification - Qualify With Evidence, Not Assumptions",
    stepName: "Qualification Evidence"
  },
  "03": {
    dark: "/images/supporting_risks_dark.png",
    light: "/images/supporting_risks_light.png",
    fallbackDark: "/assets/images/supporting_risks_dark.png",
    fallbackLight: "/assets/images/supporting_risks_light.png",
    alt: "RevOS SQL Qualification - Supporting Evidence and Risks",
    stepName: "Supporting Evidence & Risks"
  },
  "04": {
    dark: "/images/action_dark.webp",
    light: "/images/action_light.webp",
    fallbackDark: "/assets/images/action_dark.webp",
    fallbackLight: "/assets/images/action_light.webp",
    alt: "RevOS SQL Qualification - Turn Qualification Gaps Into Practical Actions",
    stepName: "Practical Next Actions"
  },
  "05": {
    dark: "/images/promotion_dark.webp",
    light: "/images/promotion_light.webp",
    fallbackDark: "/assets/images/promotion_dark.webp",
    fallbackLight: "/assets/images/promotion_light.webp",
    alt: "RevOS SQL Qualification - Decide Whether the Opportunity Warrants Further Investment",
    stepName: "Promotion Decision"
  }
};

export default function StoryVisualizer({ activeScene }: StoryVisualizerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const currentChapter = activeScene.chapter || "01";
  const imageConfig = SCENE_IMAGES[currentChapter] || SCENE_IMAGES["01"];

  const activeSrc = isDark ? imageConfig.dark : imageConfig.light;
  const fallbackSrc = isDark ? imageConfig.fallbackDark : imageConfig.fallbackLight;

  const [currentImgSrc, setCurrentImgSrc] = useState(activeSrc);

  // Synchronize displayed image whenever chapter or theme changes
  useEffect(() => {
    const config = SCENE_IMAGES[currentChapter] || SCENE_IMAGES["01"];
    setCurrentImgSrc(isDark ? config.dark : config.light);
  }, [currentChapter, isDark]);

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] bg-bg-surface/90 dark:bg-zinc-950/90 rounded-2xl border border-border overflow-hidden shadow-2xl flex flex-col transition-all duration-500">
      
      {/* 1. Subtle Ambient Gradient Aura in Background */}
      <div 
        className={`absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br ${activeScene.accentColor} opacity-10 dark:opacity-15 blur-3xl pointer-events-none transition-all duration-700`}
      />
      <div 
        className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-tl ${activeScene.accentColor} opacity-10 dark:opacity-15 blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* 2. Precision Dot Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.25] bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* 3. Header HUD Bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-bg-surface/80 dark:bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r ${activeScene.accentColor} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r ${activeScene.accentColor}`} />
          </span>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-text-secondary">
            SQL Qualification Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-bg-primary dark:bg-zinc-800 text-text-secondary border border-border">
            Step {currentChapter} / 05
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-bg-primary dark:bg-zinc-800 text-text-primary font-medium border border-border">
            {imageConfig.stepName}
          </span>
        </div>
      </div>

      {/* 4. Main Showcase Container (Aspect-Ratio Preserved Display) */}
      <div className="relative z-10 flex-1 w-full h-full p-3 sm:p-5 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentChapter}-${theme}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex items-center justify-center"
          >
            {/* Image Card Frame with Shadow & Rounded Corners */}
            <div className="relative group max-w-full max-h-full flex items-center justify-center rounded-xl sm:rounded-2xl p-1 sm:p-2 bg-bg-surface/50 dark:bg-zinc-900/40 border border-border/70 dark:border-zinc-800/80 shadow-xl shadow-black/5 dark:shadow-black/50 backdrop-blur-sm transition-all duration-300">
              <img
                src={currentImgSrc}
                alt={imageConfig.alt}
                onError={() => {
                  if (currentImgSrc !== fallbackSrc) {
                    setCurrentImgSrc(fallbackSrc);
                  }
                }}
                className={`w-auto h-auto max-w-full max-h-[290px] sm:max-h-[360px] lg:max-h-[calc(100vh-250px)] object-contain rounded-lg sm:rounded-xl shadow-lg border select-none transition-all duration-300 ${
                  isDark ? 'border-zinc-800/80 shadow-black/70' : 'border-zinc-200/90 shadow-black/10'
                }`}
                loading="eager"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 5. Bottom Status / Caption Pill */}
      <div className="relative z-10 px-5 py-2.5 border-t border-border/60 bg-bg-surface/70 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between text-[11px] text-text-secondary">
        <span className="font-mono text-[10px] tracking-wider text-text-secondary">
          {imageConfig.alt}
        </span>
        <span className="font-mono text-[10px] hidden md:inline text-text-secondary/70">
          RevOS • {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>
    </div>
  );
}
