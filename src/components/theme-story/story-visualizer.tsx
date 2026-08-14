import { motion, AnimatePresence } from 'motion/react';
import { Settings, Cpu, ShieldAlert, Disc, Hammer } from 'lucide-react';
import { StoryScene } from './story-data';

interface StoryVisualizerProps {
  activeScene: StoryScene;
}

export default function StoryVisualizer({ activeScene }: StoryVisualizerProps) {
  const { gearRotation, zoom, complexity, gridOpacity, activeComponent } = activeScene.visualState;

  // Render decorative gears with custom sizes and rotation directions
  const renderGears = () => {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Central Escapement Wheel */}
        <motion.div
          animate={{ rotate: gearRotation, scale: zoom }}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
          className="relative w-72 h-72 rounded-full border-2 border-dashed border-zinc-700/60 flex items-center justify-center"
        >
          {/* Inner mechanical wheel spokes */}
          <div className="absolute inset-0 border border-zinc-800 rounded-full scale-75"></div>
          <div className="absolute inset-0 border border-zinc-800 rounded-full scale-50"></div>
          <div className="absolute w-full h-[1px] bg-zinc-800/80 top-1/2 left-0"></div>
          <div className="absolute h-full w-[1px] bg-zinc-800/80 left-1/2 top-0"></div>
          
          {/* Radial tick marks */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-4 bg-zinc-700/80"
              style={{
                transform: `rotate(${i * 30}deg) translateY(-144px)`,
              }}
            />
          ))}

          {/* Central Rotating Emblem */}
          <motion.div 
            animate={{ rotate: -gearRotation * 1.5 }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
            className="w-24 h-24 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner"
          >
            <Settings className="w-10 h-10 text-zinc-600 animate-pulse" />
          </motion.div>
        </motion.div>

        {/* Top Right Gear (Secondary Gear Train) */}
        <motion.div
          animate={{ rotate: -gearRotation * 1.2 + 25, scale: zoom * 0.8 }}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
          className="absolute top-[10%] right-[10%] w-48 h-48 rounded-full border border-zinc-800 flex items-center justify-center"
        >
          <div className="absolute w-full h-[1px] bg-zinc-800/40 top-1/2"></div>
          <div className="absolute h-full w-[1px] bg-zinc-800/40 left-1/2"></div>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-3 bg-zinc-800"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-96px)`,
              }}
            />
          ))}
          <Cpu className="w-6 h-6 text-zinc-700" />
        </motion.div>

        {/* Bottom Left Gear (Winding Barrel Gear) */}
        <motion.div
          animate={{ rotate: -gearRotation * 0.6 - 45, scale: zoom * 1.1 }}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
          className="absolute bottom-[12%] left-[8%] w-56 h-56 rounded-full border border-zinc-800 flex items-center justify-center"
        >
          <div className="absolute inset-0 border border-zinc-800/40 rounded-full scale-90"></div>
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-3.5 bg-zinc-800"
              style={{
                transform: `rotate(${i * 22.5}deg) translateY(-112px)`,
              }}
            />
          ))}
          <Disc className="w-8 h-8 text-zinc-700" />
        </motion.div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center transition-colors duration-700">
      
      {/* 1. Blueprint Grid Overlay */}
      <motion.div 
        animate={{ opacity: gridOpacity }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"
      />

      {/* 2. Abstract Radial Alignment Grid */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[85%] h-[85%] rounded-full border border-zinc-900/40 flex items-center justify-center">
          <div className="w-[80%] h-[80%] rounded-full border border-zinc-900/60 flex items-center justify-center">
            <div className="w-[70%] h-[70%] rounded-full border border-zinc-900/80 flex items-center justify-center">
              <div className="w-[50%] h-[50%] rounded-full border border-zinc-800/40" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Render Simulated Mechanical Gear Train */}
      {renderGears()}

      {/* 4. Active Component Highlight HUD Overlay */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-end border-t border-zinc-900 pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-mono">SYSTEM METRICS</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeScene.accentColor} animate-ping`} />
            <span className="text-sm font-semibold text-zinc-200 font-mono">
              F: {(complexValToFreq(complexity)).toFixed(1)} Hz / {complexity * 2} Jewels
            </span>
          </div>
        </div>

        {/* Dynamic HUD Indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeComponent}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1.5 rounded-full"
          >
            {getIconForComponent(activeComponent)}
            <span className="text-[10px] tracking-wider text-zinc-300 font-mono uppercase">
              {activeComponent.replace('-', ' ')}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Corner Compass/Calibrator Accents */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-zinc-600 select-none">
        CALIBRATION: 47.192° N
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-zinc-600 select-none">
        SYS.STATE: OPERATIONAL
      </div>
    </div>
  );
}

// Simple logic to convert complexity factor to frequency
function complexValToFreq(complexity: number): number {
  return 2.5 + (complexity / 4);
}

// Select suitable Horology Icons based on active section
function getIconForComponent(comp: 'escapement' | 'balance-wheel' | 'train' | 'dial') {
  const iconClass = "w-3.5 h-3.5 text-zinc-400";
  switch (comp) {
    case 'escapement':
      return <Cpu className={iconClass} />;
    case 'balance-wheel':
      return <ShieldAlert className={iconClass} />;
    case 'train':
      return <Disc className={iconClass} />;
    case 'dial':
      return <Hammer className={iconClass} />;
  }
}
