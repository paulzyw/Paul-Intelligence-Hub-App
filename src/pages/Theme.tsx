import MechanicalWatch from '../components/MechanicalWatch';
import { ScrollytellingContainer } from '../components/theme-story';
import { GearTrainBg } from '../components/GearTrainBg';

export function Theme() {
  return (
    <div className="flex flex-col w-full">
      {/* NEW HERO SECTION WITH GEAR TRAIN BACKGROUND ANIMATION */}
      <section id="hero" className="relative w-full bg-bg-hero-primary py-12 lg:py-0 overflow-hidden flex items-center lg:h-[880px] lg:min-h-[880px] min-h-[600px] transition-colors duration-400 border-b border-border-hero/20">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary to-transparent"></div>
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 lg:h-[880px] lg:min-h-[880px] flex items-center">
          {/* Left Column: Heading & Content */}
          <div className="w-full lg:max-w-[65%] text-left flex flex-col items-start space-y-6 z-10 relative">
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-hero-primary leading-tight">
              Accelerate Revenue Growth with an AI-Native Revenue Operating System
            </h1>
            <p className="max-w-xl text-lg text-text-hero-secondary leading-relaxed">
              RevOS connects strategy, execution, intelligence and optimization into one continuously improving revenue engine 
              T—helping enterprises accelerate growth, increase revenue operations efficiency and improve predictability.
            </p>
            <div className="flex flex-wrap gap-4 justify-start pt-4">
              <button className="px-6 py-3 rounded-lg font-medium bg-[#ED8936] text-white hover:bg-[#dd7926] transition-colors duration-300 shadow-lg shadow-[#ED8936]/20">
                Get Started
              </button>
              <button className="px-6 py-3 rounded-lg font-medium border border-border-hero/40 text-text-hero-primary hover:bg-[#ED8936]/10 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>

          {/* Right/Overlay Column: Overlapping Background Gear Train without border */}
          <div className="absolute inset-y-0 right-0 w-full lg:w-[65%] flex items-center justify-end z-0 pointer-events-none overflow-hidden">
            <div className="w-full max-w-[550px] md:max-w-[680px] lg:max-w-[800px] xl:max-w-[880px] aspect-square flex items-center justify-end p-0 m-0 opacity-40 lg:opacity-75">
              <GearTrainBg />
            </div>
          </div>
        </div>
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

