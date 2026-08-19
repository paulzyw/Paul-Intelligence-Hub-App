import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Brain, 
  Workflow, 
  Network, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';
import MechanicalWatch from '../components/MechanicalWatch';
import { ScrollytellingContainer } from '../components/theme-story';
import GradientWaves from '../components/GradientWaves';

export function Theme() {
  return (
    <div className="flex flex-col w-full">
      {/* NEW HERO SECTION DUPLICATING SOLUTIONS HERO CONTENT (WITHOUT THREADS OR GEAR TRAIN) */}
      <section id="hero" className="relative w-full bg-bg-hero-primary pt-32 pb-28 overflow-hidden transition-colors duration-400">
        {/* WebGL Gradient Waves background */}
        <div className="absolute inset-0 z-0 opacity-100">
          <GradientWaves 
            horizonColor="#1b2f3e"
            waveColor="#00a3e0"
            crestColor="#A0AEC0"
            speed={0.5}
            amplitude={2.5}
            waveScale={0.6}
            opacity={1.0}
            brightness={2.0}
            detail="medium"
          />
        </div>

        {/* Grid overlay over the WebGL waves for a technical mesh look */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-10 pointer-events-none"></div>
        {/* Soft fade-out gradient overlay to blend waves with the rest of the dark page */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary via-bg-hero-primary/10 to-transparent z-10 pointer-events-none"></div>
    
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-accent mb-4">
              AI-Native Intelligence System
            </h2>
            
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-text-hero-primary mb-10 max-w-5xl mx-auto leading-[1.1]">
              AI-Native Revenue Operating System Accelerates your <br className="hidden md:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-hero-primary via-accent to-text-primary bg-[length:200%_auto] animate-gradient">
                Revenue Growth
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-text-hero-secondary max-w-5xl mx-auto leading-relaxed font-medium mb-12">
              RevOS connects strategy, execution, intelligence and optimization into one continuously improving revenue engine - 
              helping enterprises accelerate growth, increase revenue operations efficiency and improve predictability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/solutions/revos" 
                className="group relative px-8 py-4 bg-accent text-text-hero-primary font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="relative z-10 flex items-center gap-2">
                  Explore RevOS <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* SCROLL INDICATOR */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center pointer-events-none z-10"
        >
          <div className="w-5 h-8 border-2 border-text-hero-secondary/30 rounded-full flex justify-center p-1">
            <motion.div
              animate={{
                y: [0, 12, 0],
                opacity: [1, 0.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1 h-1.5 bg-accent rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* GROWTH OUTCOMES SECTION */}
      <section id="growth-outcomes" className="relative w-full bg-bg-hero-primary py-20 lg:py-20 overflow-hidden flex flex-col items-center justify-center min-h-screen transition-colors duration-400">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#80808012_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-semibold tracking-wider text-[#ED8936] uppercase">
              Interactive Visualization
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-hero-primary">
              Growth Outcomes
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-hero-secondary">
              Interact with the multi-dimensional growth engine model to visualize real-time pipeline acceleration and operational performance.
            </p>
          </div>
          
          <MechanicalWatch />
        </div>
      </section>

      {/* SCROLLYTELLING COMPONENT */}
      <ScrollytellingContainer />
    </div>
  );
}

