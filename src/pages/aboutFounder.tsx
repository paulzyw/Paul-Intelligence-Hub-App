import { motion, Variants } from 'motion/react';
import { Target, Zap, Leaf, ArrowRight, Compass, Sparkles, TrendingUp, ShieldCheck, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WhyIBuiltRevosSection } from '../components/founder/WhyIBuiltRevosSection';

export function AboutFounder() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.5
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="flex flex-col w-full bg-bg-primary text-text-primary min-h-screen">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full"
      >
        {/* Section A: The Vision (Hero) */}
        <motion.section 
          variants={itemVariants} 
          className="relative w-full py-28 lg:py-36 px-4 sm:px-6 lg:px-8 bg-bg-hero-primary text-text-hero-primary border-b border-border-hero overflow-hidden transition-colors duration-400"
        >
          {/* Subtle Ambient Radial Lighting & Vector Coordinate Accent */}
          <div 
            aria-hidden="true" 
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          >
            <div 
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-25 blur-[150px] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, var(--accent) 0%, #002b5c 50%, transparent 75%)' }}
            />
            <svg 
              className="absolute inset-0 w-full h-full opacity-[0.05]" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none"
            >
              <defs>
                <pattern id="founder-hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="var(--accent)" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#founder-hero-grid)" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-[0.25em] text-accent uppercase mb-6">
              <span>FOUNDER VISION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 leading-[1.15] text-text-hero-primary max-w-4xl mx-auto">
              Turning Technology and Intelligence into Meaningful Business Impact.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-text-hero-secondary max-w-4xl mx-auto leading-relaxed font-normal">
              I believe technology creates value when it enables better decisions, stronger businesses and lasting progress. My work connects enterprise technology, digital transformation and AI innovation to turn complex challenges into meaningful outcomes.
            </p>
          </div>
        </motion.section>

        {/* Section B: Purpose & Mission (The Dual Core) */}
        <motion.section id="the-purpose-and-the-mission" variants={itemVariants} className="w-full py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-surface">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* My Purpose Card */}
            <div className="p-8 sm:p-10 rounded-2xl border border-border bg-bg-primary hover:border-accent/60 shadow-lg transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  <span className="text-xs font-mono font-semibold text-accent uppercase tracking-wider">
                    My Purpose
                  </span>
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-text-primary group-hover:text-accent transition-colors leading-snug">
                  To transform technology and intelligence into human and business value.
                </h3>
              </div>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed pt-2">
                I believe innovation matters only when it creates tangible value — turning information into understanding, ideas into action, and ambition into progress.
              </p>
            </div>

            {/* My Mission Card */}
            <div className="p-8 sm:p-10 rounded-2xl border border-border bg-bg-primary hover:border-accent/60 shadow-lg transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  <span className="text-xs font-mono font-semibold text-accent uppercase tracking-wider">
                    My Mission
                  </span>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-text-primary group-hover:text-accent transition-colors leading-snug">
                  To bridge the gap between strategic ambition and realized business outcomes.
                </h3>
              </div>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed pt-2">
                Through technology, structured methodologies and intelligent execution, I aim to help organizations solve complex challenges, make better decisions and achieve sustainable growth.
              </p>
            </div>

          </div>
        </motion.section>

        {/* Section B.1: Why I Built RevOS (Storytelling Section) */}
        <motion.div variants={itemVariants} className="w-full">
          <WhyIBuiltRevosSection />
        </motion.div>

        {/* Section C: My Values (6-Card Executive Framework) */}
        <motion.section variants={itemVariants} className="w-full py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-surface">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono font-semibold tracking-widest text-accent uppercase">
                CORE PRINCIPLES
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mt-3">
                My Values
              </h2>
              <p className="text-text-secondary text-base sm:text-lg mt-4 max-w-2xl mx-auto">
                Guiding beliefs that shape how I approach enterprise technology, commercial strategy, and long-term organizational impact.
              </p>
            </div>

            {/* 6-Card Responsive Grid (3 columns on desktop, 2 on tablet, 1 on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Value 1 */}
              <div className="p-8 rounded-2xl border border-border bg-bg-primary hover:border-accent hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
                    <span className="text-xs font-mono font-bold text-accent">01</span>
                    <Zap className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary group-hover:text-accent transition-colors">
                    Outcome-Driven Innovation
                  </h3>
                </div>
                <p className="text-text-secondary text-base leading-relaxed mt-2">
                  Turning technology and ideas into measurable business and economic value.
                </p>
              </div>

              {/* Value 2 */}
              <div className="p-8 rounded-2xl border border-border bg-bg-primary hover:border-accent hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
                    <span className="text-xs font-mono font-bold text-accent">02</span>
                    <Compass className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary group-hover:text-accent transition-colors">
                    Strategic Clarity
                  </h3>
                </div>
                <p className="text-text-secondary text-base leading-relaxed mt-2">
                  Bringing structure to complexity and translating insight into decisive action.
                </p>
              </div>

              {/* Value 3 */}
              <div className="p-8 rounded-2xl border border-border bg-bg-primary hover:border-accent hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
                    <span className="text-xs font-mono font-bold text-accent">03</span>
                    <ShieldCheck className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary group-hover:text-accent transition-colors">
                    Evidence and Integrity
                  </h3>
                </div>
                <p className="text-text-secondary text-base leading-relaxed mt-2">
                  Building trust through evidence, transparent reasoning and honest communication.
                </p>
              </div>

              {/* Value 4 */}
              <div className="p-8 rounded-2xl border border-border bg-bg-primary hover:border-accent hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
                    <span className="text-xs font-mono font-bold text-accent">04</span>
                    <UserCheck className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary group-hover:text-accent transition-colors">
                    Human-Centered Intelligence
                  </h3>
                </div>
                <p className="text-text-secondary text-base leading-relaxed mt-2">
                  Using technology and AI to amplify human capability and strengthen decision-making.
                </p>
              </div>

              {/* Value 5 */}
              <div className="p-8 rounded-2xl border border-border bg-bg-primary hover:border-accent hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
                    <span className="text-xs font-mono font-bold text-accent">05</span>
                    <Leaf className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary group-hover:text-accent transition-colors">
                    Sustainable Impact
                  </h3>
                </div>
                <p className="text-text-secondary text-base leading-relaxed mt-2">
                  Creating lasting business value while advancing environmental and societal progress.
                </p>
              </div>

              {/* Value 6 (bg-accent/60 Highlight Card) */}
              <div className="p-8 rounded-2xl border border-accent/80 bg-accent/60 shadow-lg hover:bg-accent/70 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between backdrop-blur-sm">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                    <span className="text-xs font-mono font-bold text-white">06</span>
                    <Sparkles className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white transition-colors">
                    Entrepreneurial Vision
                  </h3>
                </div>
                <p className="text-white/95 text-base leading-relaxed mt-2 font-medium">
                  Challenging conventions, embracing possibilities and turning bold ideas into reality.
                </p>
              </div>

            </div>
          </div>
        </motion.section>


        {/* Section D: The Vision Continues (Executive Full-Width Narrative Conclusion) */}
        <motion.section 
          id="the-vision-continues" 
          variants={itemVariants} 
          className="relative w-full py-28 lg:py-36 px-4 sm:px-6 lg:px-8 bg-bg-hero-primary text-text-hero-primary border-t border-border-hero overflow-hidden transition-colors duration-400"
        >
          {/* BACKGROUND: Pure code-based subtle gradients & restrained connected-line visual elements */}
          <div 
            aria-hidden="true" 
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          >
            {/* Atmospheric soft radial light cone from upper-right corner */}
            <div 
              className="absolute -top-32 right-0 w-[700px] h-[700px] rounded-full opacity-25 blur-[160px] pointer-events-none"
              style={{ background: 'radial-gradient(circle at 75% 25%, #6366f1 0%, var(--accent) 30%, #002b5c 65%, transparent 80%)' }}
            />
            <div 
              className="absolute -bottom-32 -left-20 w-[550px] h-[550px] rounded-full opacity-10 blur-[140px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, #002b5c 0%, transparent 70%)' }}
            />

            {/* PURE VECTOR CONNECTED-LINE CONSTELLATION & HEXAGON MESH (SUBTLE DISPLAY) */}
            <svg
              className="absolute top-0 right-0 w-full sm:w-[90%] lg:w-[70%] xl:w-[60%] h-full opacity-40 sm:opacity-45 lg:opacity-50 pointer-events-none select-none transition-opacity duration-500"
              viewBox="0 0 1000 700"
              preserveAspectRatio="xMaxYMin slice"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              <defs>
                {/* Subtle Hexagonal blueprint grid */}
                <pattern id="cta-hex-mesh" width="56" height="96.99" patternUnits="userSpaceOnUse">
                  <path
                    d="M 28 0 L 56 16.16 L 56 48.49 L 28 64.66 L 0 48.49 L 0 16.16 Z M 28 64.66 L 56 80.82 L 56 113.15 L 28 129.32 L 0 113.15 L 0 80.82 Z"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="0.5"
                    strokeOpacity="0.02"
                  />
                </pattern>

                {/* Subdued Facet gradients */}
                <linearGradient id="facet-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.04" />
                  <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#002b5c" stopOpacity="0.005" />
                </linearGradient>

                <linearGradient id="facet-cyan" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.035" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                </linearGradient>

                {/* Soft node outer glow filter */}
                <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Faint Hexagonal Background */}
              <rect width="100%" height="100%" fill="url(#cta-hex-mesh)" opacity="0.4" />

              {/* Polygonal 3D-feeling Mesh Facets (Whisper-soft) */}
              <g stroke="var(--accent)" strokeWidth="0.5" strokeOpacity="0.12">
                {/* Top tier facets */}
                <polygon points="1020,30 940,90 980,170" fill="url(#facet-glow)" />
                <polygon points="940,90 860,50 910,140" fill="url(#facet-cyan)" />
                <polygon points="860,50 780,100 830,190" fill="url(#facet-glow)" />
                <polygon points="780,100 700,60 740,160" fill="url(#facet-cyan)" />
                <polygon points="700,60 620,120 670,210" fill="url(#facet-glow)" />
                <polygon points="620,120 540,80 580,190" fill="url(#facet-cyan)" />
                <polygon points="540,80 470,150 510,240" fill="url(#facet-glow)" />
                <polygon points="470,150 410,110 440,220" fill="url(#facet-cyan)" />

                {/* Middle tier facets */}
                <polygon points="940,90 910,140 980,170" fill="url(#facet-cyan)" />
                <polygon points="910,140 830,190 920,260" fill="url(#facet-glow)" />
                <polygon points="860,50 830,190 780,100" fill="url(#facet-cyan)" />
                <polygon points="830,190 740,160 770,270" fill="url(#facet-glow)" />
                <polygon points="740,160 670,210 710,310" fill="url(#facet-cyan)" />
                <polygon points="670,210 580,190 620,300" fill="url(#facet-glow)" />
                <polygon points="580,190 510,240 550,350" fill="url(#facet-cyan)" />
                <polygon points="510,240 440,220 480,340" fill="url(#facet-glow)" />
                <polygon points="440,220 380,290 430,370" fill="url(#facet-cyan)" />

                {/* Lower cascading facets */}
                <polygon points="980,170 920,260 960,360" fill="url(#facet-cyan)" />
                <polygon points="920,260 850,330 890,430" fill="url(#facet-glow)" />
                <polygon points="830,190 770,270 850,330" fill="url(#facet-cyan)" />
                <polygon points="770,270 710,310 790,420" fill="url(#facet-glow)" />
                <polygon points="710,310 620,300 680,410" fill="url(#facet-cyan)" />
                <polygon points="620,300 550,350 630,460" fill="url(#facet-glow)" />
                <polygon points="550,350 480,340 530,450" fill="url(#facet-cyan)" />
                <polygon points="480,340 430,370 470,490" fill="url(#facet-glow)" />
                <polygon points="430,370 360,420 420,510" fill="url(#facet-cyan)" />
                <polygon points="380,290 320,370 360,420" fill="url(#facet-glow)" />

                {/* Trailing fine edges */}
                <polygon points="890,430 820,500 860,580" fill="url(#facet-cyan)" />
                <polygon points="790,420 720,490 760,590" fill="url(#facet-glow)" />
                <polygon points="680,410 600,480 650,570" fill="url(#facet-cyan)" />
                <polygon points="630,460 550,530 600,620" fill="url(#facet-glow)" />
                <polygon points="530,450 460,520 500,610" fill="url(#facet-cyan)" />
              </g>

              {/* Connecting structural lines (Subtle, restrained accent) */}
              <g stroke="var(--accent)" strokeWidth="0.75" strokeOpacity="0.2">
                <line x1="1020" y1="30" x2="940" y2="90" />
                <line x1="940" y1="90" x2="860" y2="50" />
                <line x1="860" y1="50" x2="780" y2="100" />
                <line x1="780" y1="100" x2="700" y2="60" />
                <line x1="700" y1="60" x2="620" y2="120" />
                <line x1="620" y1="120" x2="540" y2="80" />
                <line x1="540" y1="80" x2="470" y2="150" />
                <line x1="470" y1="150" x2="410" y2="110" />
                
                <line x1="980" y1="170" x2="910" y2="140" />
                <line x1="910" y1="140" x2="830" y2="190" />
                <line x1="830" y1="190" x2="740" y2="160" />
                <line x1="740" y1="160" x2="670" y2="210" />
                <line x1="670" y1="210" x2="580" y2="190" />
                <line x1="580" y1="190" x2="510" y2="240" />
                <line x1="510" y1="240" x2="440" y2="220" />
                <line x1="440" y1="220" x2="380" y2="290" />

                <line x1="920" y1="260" x2="850" y2="330" />
                <line x1="850" y1="330" x2="770" y2="270" />
                <line x1="770" y1="270" x2="710" y2="310" />
                <line x1="710" y1="310" x2="620" y2="300" />
                <line x1="620" y1="300" x2="550" y2="350" />
                <line x1="550" y1="350" x2="480" y2="340" />
                <line x1="480" y1="340" x2="430" y2="370" />
                <line x1="430" y1="370" x2="360" y2="420" />
              </g>

              {/* Secondary delicate bridge lines (subtle cyan/indigo) */}
              <g stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.14" strokeDasharray="2 3">
                <line x1="860" y1="50" x2="920" y2="260" />
                <line x1="780" y1="100" x2="710" y2="310" />
                <line x1="700" y1="60" x2="620" y2="300" />
                <line x1="620" y1="120" x2="550" y2="350" />
                <line x1="540" y1="80" x2="480" y2="340" />
                <line x1="470" y1="150" x2="430" y2="370" />
                <line x1="410" y1="110" x2="360" y2="420" />
              </g>

              {/* Glowing Constellation Network Nodes (Subdued, delicate data points) */}
              <g>
                {([
                  { cx: 1020, cy: 30, r: 3.2, isAnchor: true },
                  { cx: 940, cy: 90, r: 2.8, isAnchor: true },
                  { cx: 860, cy: 50, r: 3.2, isAnchor: true },
                  { cx: 780, cy: 100, r: 2.2, isAnchor: false },
                  { cx: 700, cy: 60, r: 2.8, isAnchor: true },
                  { cx: 620, cy: 120, r: 2.2, isAnchor: false },
                  { cx: 540, cy: 80, r: 2.8, isAnchor: true },
                  { cx: 470, cy: 150, r: 2.2, isAnchor: false },
                  { cx: 410, cy: 110, r: 2.2, isAnchor: false },
                  
                  { cx: 980, cy: 170, r: 2.8, isAnchor: true },
                  { cx: 910, cy: 140, r: 2.2, isAnchor: false },
                  { cx: 830, cy: 190, r: 3.2, isAnchor: true },
                  { cx: 740, cy: 160, r: 2.2, isAnchor: false },
                  { cx: 670, cy: 210, r: 2.8, isAnchor: true },
                  { cx: 580, cy: 190, r: 2.2, isAnchor: false },
                  { cx: 510, cy: 240, r: 2.8, isAnchor: true },
                  { cx: 440, cy: 220, r: 2.2, isAnchor: false },
                  { cx: 380, cy: 290, r: 2.0, isAnchor: false },

                  { cx: 920, cy: 260, r: 2.8, isAnchor: true },
                  { cx: 850, cy: 330, r: 2.2, isAnchor: false },
                  { cx: 770, cy: 270, r: 2.8, isAnchor: true },
                  { cx: 710, cy: 310, r: 2.2, isAnchor: false },
                  { cx: 620, cy: 300, r: 2.8, isAnchor: true },
                  { cx: 550, cy: 350, r: 2.2, isAnchor: false },
                  { cx: 480, cy: 340, r: 2.8, isAnchor: true },
                  { cx: 430, cy: 370, r: 2.0, isAnchor: false },
                  { cx: 360, cy: 420, r: 2.2, isAnchor: false },

                  { cx: 960, cy: 360, r: 2.0, isAnchor: false },
                  { cx: 890, cy: 430, r: 2.2, isAnchor: false },
                  { cx: 790, cy: 420, r: 2.2, isAnchor: false },
                  { cx: 680, cy: 410, r: 2.2, isAnchor: false },
                  { cx: 630, cy: 460, r: 2.0, isAnchor: false },
                  { cx: 530, cy: 450, r: 2.2, isAnchor: false },
                  { cx: 470, cy: 490, r: 2.0, isAnchor: false },
                  { cx: 420, cy: 510, r: 2.0, isAnchor: false },
                  { cx: 320, cy: 370, r: 1.8, isAnchor: false }
                ] as const).map((node, idx) => (
                  <g key={idx}>
                    {/* Outer radiant halo for key anchor nodes */}
                    {node.isAnchor && (
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={node.r * 2.2}
                        fill="var(--accent)"
                        fillOpacity="0.08"
                        filter="url(#node-glow)"
                      />
                    )}
                    {/* Primary node body */}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={node.r}
                      fill="var(--accent)"
                      fillOpacity="0.5"
                      stroke="var(--accent)"
                      strokeWidth="0.4"
                      strokeOpacity="0.3"
                    />
                    {/* Subtle core dot */}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={node.r * 0.35}
                      fill="#ffffff"
                      fillOpacity="0.4"
                    />
                  </g>
                ))}
              </g>
            </svg>

            {/* Seamless gradient fade mask towards bottom and left */}
            <div className="absolute inset-0 bg-gradient-to-r from-bg-hero-primary via-bg-hero-primary/80 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary via-transparent to-transparent pointer-events-none" />
          </div>


          {/* MAIN NARRATIVE CONTENT */}
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            
            {/* Eyebrow with restrained editorial lines */}
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-accent/60" />
              <span className="text-xs font-mono font-semibold tracking-[0.25em] text-accent uppercase">
                THE VISION CONTINUES
              </span>
              <span className="w-8 h-px bg-accent/60" />
            </div>
            
            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-hero-primary leading-[1.2] max-w-3xl mx-auto">
              Better Revenue Outcomes Begin with Better Thinking
            </h2>

            {/* Reflective Founder's Narrative Prose */}
            <div className="mt-10 sm:mt-12 space-y-6 text-text-hero-secondary text-base sm:text-lg lg:text-[1.125rem] leading-relaxed max-w-4xl mx-auto text-center font-normal">
              <p className="text-text-hero-primary font-medium text-lg sm:text-xl leading-relaxed">
                I built RevOS on the belief that better revenue growth starts with better business decisions.
              </p>
              <p>
                By bringing together structured methodologies, evidence-informed AI reasoning and actionable intelligence, RevOS aims to help individuals and organizations approach revenue challenges with greater clarity, discipline and confidence.
              </p>
              <p>
                This is more than a technology platform. It is an ongoing effort to rethink how we understand revenue, make decisions and turn strategy into action.
              </p>
              <p className="text-accent font-medium pt-2">
                I invite you to explore RevOS and discover a better way to approach revenue growth.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto">
              {/* Primary CTA */}
              <Link
                to="/product/revos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-accent text-white shadow-lg shadow-accent/20 hover:opacity-90 active:scale-[0.98] transition-all group"
              >
                <span>Explore RevOS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary CTA */}
              <Link
                to="/product/overview/revos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold border border-border-hero bg-bg-hero-surface/50 hover:bg-bg-hero-surface hover:border-accent/60 text-text-hero-primary active:scale-[0.98] transition-all backdrop-blur-sm group"
              >
                <Compass className="w-4 h-4 text-accent" />
                <span>Explore the RevOS Platform</span>
                <ArrowRight className="w-4 h-4 text-text-hero-secondary group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Closing Signature */}
            <div className="mt-16 sm:mt-20 pt-10 border-t border-border-hero/60 text-center max-w-xl mx-auto">
              <p className="text-base sm:text-lg font-mono tracking-wide text-text-hero-secondary italic">
                “The journey is ongoing. The vision is clear.”
              </p>
              <div className="mt-3 flex items-center justify-center gap-2.5 text-xs font-mono text-accent/80 tracking-widest uppercase">
                <span className="font-semibold text-text-hero-primary">Paul W.</span>
                <span className="text-border-hero">•</span>
                <span>Founder & Architect, RevOS</span>
              </div>
            </div>

          </div>
        </motion.section>

      </motion.div>
    </div>
  );
}

export const About = AboutFounder;
