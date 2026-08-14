import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles, Navigation } from 'lucide-react';
import { STORY_SCENES, StoryScene } from './story-data';
import StoryVisualizer from './story-visualizer';

export default function ScrollytellingContainer() {
  const [activeScene, setActiveScene] = useState<StoryScene>(STORY_SCENES[0]);

  return (
    <div className="w-full bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-24 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>INTERACTIVE HOROLOGY NARRATIVE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Crafting the Pulse of Gravity
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
            Scroll down to explore the intricate mechanical physics and custom-carved design decisions behind our signature watch complications.
          </p>
        </div>

        {/* Split Screen Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
          
          {/* Left Column: Sticky Visual Panel */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 w-full h-[380px] sm:h-[450px] lg:h-[calc(100vh-160px)] flex items-center justify-center z-10">
            <div className="w-full h-full max-w-xl mx-auto">
              <StoryVisualizer activeScene={activeScene} />
            </div>
          </div>

          {/* Right Column: Scrolling Narrative Cards */}
          <div className="lg:col-span-6 space-y-[30vh] lg:space-y-[40vh] pb-[20vh] lg:pb-[30vh]">
            {STORY_SCENES.map((scene, index) => {
              const isActive = activeScene.id === scene.id;

              return (
                <motion.div
                  key={scene.id}
                  id={scene.id}
                  // viewport: when 45% of the card is visible in the viewport, activate this scene
                  onViewportEnter={() => {
                    setActiveScene(scene);
                  }}
                  viewport={{ amount: 0.45 }}
                  initial={{ opacity: 0.15, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`relative p-8 rounded-2xl border transition-all duration-500 group ${
                    isActive 
                      ? 'bg-zinc-900/50 border-zinc-800/80 shadow-lg shadow-black/40' 
                      : 'bg-zinc-950 border-transparent hover:border-zinc-900'
                  }`}
                >
                  {/* Decorative Side Highlight */}
                  <div className={`absolute top-0 bottom-0 left-0 w-[3px] rounded-l-2xl transition-all duration-700 ${
                    isActive 
                      ? `bg-gradient-to-b ${scene.accentColor} opacity-100` 
                      : 'bg-transparent opacity-0'
                  }`} />

                  {/* Chapter Badge */}
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-mono text-3xl font-extrabold text-zinc-800 group-hover:text-zinc-700 transition-colors duration-400">
                      {scene.chapter}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-mono font-bold bg-zinc-900/80 border ${
                      isActive 
                        ? 'text-zinc-200 border-zinc-700/80 shadow-sm' 
                        : 'text-zinc-500 border-zinc-800/40'
                    }`}>
                      {scene.badgeText}
                    </span>
                  </div>

                  {/* Card Main Header */}
                  <h3 className={`text-xl sm:text-2xl font-bold tracking-tight mb-4 transition-colors duration-400 ${
                    isActive ? 'text-white' : 'text-zinc-400'
                  }`}>
                    {scene.title}
                  </h3>

                  {/* Narrative Copy */}
                  <p className={`text-sm sm:text-base leading-relaxed mb-6 transition-colors duration-500 ${
                    isActive ? 'text-zinc-300' : 'text-zinc-500'
                  }`}>
                    {scene.description}
                  </p>

                  {/* Scene-Specific Action Button */}
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        // Smooth scroll to the specific element if clicked
                        document.getElementById(scene.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase transition-colors duration-300 ${
                        isActive 
                          ? 'text-amber-500 hover:text-amber-400' 
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      <span>Focus Subassembly</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Final Call To Action Card */}
            <motion.div
              initial={{ opacity: 0.15, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60 shadow-2xl text-center space-y-6"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-white">Your Time, Reimagined</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Now that you have explored the inner blueprint mechanism, customize your personal mechanical watch colors, speed, and dimensions in the interactive workbench above.
              </p>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-bold uppercase tracking-widest rounded-lg transition-colors duration-300 shadow-lg shadow-amber-500/10"
              >
                <span>Back to Sandbox</span>
              </button>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
