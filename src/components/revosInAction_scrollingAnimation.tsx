import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, Search } from 'lucide-react';
import { StoryScene } from './theme-story/story-data';
import { useTheme } from '../context/ThemeContext';

export interface RevosInActionScrollingAnimationProps {
  activeScene: StoryScene;
}

export type StoryVisualizerProps = RevosInActionScrollingAnimationProps;

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

interface ImageWithLensMagnifierProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  isDark: boolean;
}

function ImageWithLensMagnifier({ src, fallbackSrc, alt, isDark }: ImageWithLensMagnifierProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const lensBodyRef = useRef<HTMLDivElement>(null);

  const LENS_SIZE = 170; // Diameter of circular magnifying glass
  const LENS_RADIUS = LENS_SIZE / 2;
  const ZOOM_LEVEL = 2.4; // 2.4x magnification factor

  useEffect(() => {
    setImgSrc(src);
    setIsHovering(false);
  }, [src]);

  const updateMagnifier = (clientX: number, clientY: number) => {
    if (!imgRef.current || !lensRef.current || !lensBodyRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Boundary check: ensure cursor is within actual image boundaries
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      setIsHovering(false);
      return;
    }

    if (!isHovering) {
      setIsHovering(true);
    }

    // Direct GPU translate3d ensures 0ms latency cursor-following without React rerender lag
    lensRef.current.style.transform = `translate3d(${x - LENS_RADIUS}px, ${y - LENS_RADIUS}px, 0)`;

    // Calculate background-position so the exact point under cursor is centered in the lens
    const bgX = LENS_RADIUS - x * ZOOM_LEVEL;
    const bgY = LENS_RADIUS - y * ZOOM_LEVEL;
    lensBodyRef.current.style.backgroundPosition = `${bgX}px ${bgY}px`;
    lensBodyRef.current.style.backgroundSize = `${rect.width * ZOOM_LEVEL}px ${rect.height * ZOOM_LEVEL}px`;
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    updateMagnifier(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    updateMagnifier(e.clientX, e.clientY);
  };

  const handlePointerLeave = () => {
    setIsHovering(false);
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative inline-flex items-center justify-center max-w-full max-h-full cursor-crosshair select-none group/magnifier"
    >
      {/* Target Image with preserved ratio */}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
        }}
        className={`w-auto h-auto max-w-full max-h-[290px] sm:max-h-[360px] lg:max-h-[calc(100vh-250px)] object-contain rounded-lg sm:rounded-xl shadow-lg border select-none transition-all duration-300 pointer-events-auto ${
          isDark ? 'border-zinc-800/80 shadow-black/70' : 'border-zinc-200/90 shadow-black/10'
        }`}
        loading="eager"
      />

      {/* Discovery Hint Badge (fades away when magnifier lens is actively inspecting) */}
      <div 
        className={`absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 pointer-events-none transition-all duration-300 z-20 ${
          isHovering ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-90 scale-100'
        }`}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/80 dark:bg-black/85 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-mono shadow-md">
          <ZoomIn className="w-3 h-3 text-accent animate-pulse" />
          <span>Hover to magnify</span>
        </div>
      </div>

      {/* Magnifier Lens Container (GPU-translated 1:1 following cursor) */}
      <div
        ref={lensRef}
        className="pointer-events-none absolute top-0 left-0 z-30"
        style={{
          width: `${LENS_SIZE}px`,
          height: `${LENS_SIZE}px`,
          transform: 'translate3d(-9999px, -9999px, 0)',
          willChange: 'transform',
        }}
      >
        {/* Optical Lens Body */}
        <div
          ref={lensBodyRef}
          className={`w-full h-full rounded-full border-[3px] border-white/95 dark:border-zinc-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.55),0_4px_12px_rgba(0,0,0,0.35),inset_0_2px_8px_rgba(255,255,255,0.7),inset_0_-2px_8px_rgba(0,0,0,0.5)] ring-2 ring-black/35 dark:ring-white/25 overflow-hidden transition-all duration-150 ease-out ${
            isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          style={{
            backgroundImage: `url("${imgSrc}")`,
            backgroundRepeat: 'no-repeat',
            backgroundColor: isDark ? '#09090b' : '#ffffff',
          }}
        >
          {/* Optical reflection highlight & curvature glare */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/45 opacity-75 pointer-events-none" />
          <div className="absolute inset-1 rounded-full border border-white/30 dark:border-white/20 pointer-events-none" />

          {/* Precision Target Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 rounded-full border border-accent/80 dark:border-accent/90 flex items-center justify-center shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-accent ring-1 ring-white/90 dark:ring-black/90" />
            </div>
            <div className="absolute w-10 h-[1px] bg-accent/40 dark:bg-accent/60 pointer-events-none" />
            <div className="absolute h-10 w-[1px] bg-accent/40 dark:bg-accent/60 pointer-events-none" />
          </div>

          {/* Lens Magnification Pill */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-zinc-950/85 backdrop-blur-md text-[9px] font-mono font-medium text-white/95 tracking-wide shadow-sm border border-white/20 pointer-events-none flex items-center gap-1">
            <span>2.4×</span>
            <span className="text-[8px] text-accent font-sans font-bold uppercase">Inspect</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RevosInActionScrollingAnimation as StoryVisualizer };

export default function RevosInActionScrollingAnimation({ activeScene }: RevosInActionScrollingAnimationProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const currentChapter = activeScene.chapter || "01";
  const imageConfig = SCENE_IMAGES[currentChapter] || SCENE_IMAGES["01"];

  const activeSrc = isDark ? imageConfig.dark : imageConfig.light;
  const fallbackSrc = isDark ? imageConfig.fallbackDark : imageConfig.fallbackLight;

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

      {/* 4. Main Showcase Container (Aspect-Ratio Preserved Display with Lens Magnifier) */}
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
              <ImageWithLensMagnifier
                src={activeSrc}
                fallbackSrc={fallbackSrc}
                alt={imageConfig.alt}
                isDark={isDark}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 5. Bottom Status / Caption Pill */}
      <div className="relative z-10 px-5 py-2.5 border-t border-border/60 bg-bg-surface/70 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between text-[11px] text-text-secondary">
        <span className="font-mono text-[10px] tracking-wider text-text-secondary flex items-center gap-1.5">
          <Search className="w-3 h-3 text-accent" />
          {imageConfig.alt}
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            <ZoomIn className="w-3 h-3" />
            <span>Interactive Magnifier</span>
          </span>
          <span className="font-mono text-[10px] hidden md:inline text-text-secondary/70">
            RevOS • {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>
      </div>
    </div>
  );
}
